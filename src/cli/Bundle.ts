import { join, resolve } from "path";
import { RollupBuild, RollupSingleFileBuild, rollup } from "rollup";
import { writeFile, copy } from "fs-extra";
import { dir } from "tmp-promise";
import deepEqual from "fast-deep-equal";
import {
  Bundle as BundleInterface,
  StablercMatch,
  BundleTaskParams,
  LoadedConfigs,
  LoadedPlugins,
  StablercPlugin,
} from "../interfaces";
import { CliArgKey } from "../enums";
import { loadModule } from "./loadModule";
import { bundleFromFiles } from "./task/BundleTask/bundleFromFiles";
import { codeForPlugins } from "./task/BundleTask/codeForPlugins";
import { instantiatePlugin } from "./stablerc/instantiatePlugin";
import { codeForTestBundle } from "./task/BundleTask/codeForTestBundle";
import { bundlerAliasForRunner } from "./bundlerAliasForRunner";
import { thunkify } from "./task/BundleTask/thunkify";
import { verboseWarn } from "./verboseWarn";
import { readTripleSlashDirectives } from "./readTripleSlashDirectives";

export class Bundle implements BundleInterface {
  static async fromConfigs(
    configs,
    params: BundleTaskParams,
  ): Promise<Map<string, Bundle>> {
    const { runner } = params;
    const bundles = new Map<string, Bundle>();
    const bundleForRunner = runner => {
      if (bundles.has(runner)) {
        return bundles.get(runner);
      }

      const bundle = new Bundle({
        ...params,
        runner,
      });

      bundles.set(runner, bundle);
      return bundle;
    };

    for (const { config, files } of configs.values()) {
      const filtered = [];

      for (const file of files) {
        let overriddenLocally = false;

        for await (const { runner: r } of readTripleSlashDirectives(file)) {
          if (params.runner == null || params.runner === r) {
            bundleForRunner(r).addMatch({ config, files: [file] });
          }
          overriddenLocally = true;
        }
        if (!overriddenLocally) {
          filtered.push(file);
        }
      }
      const { runners } = config.document;

      for (const r of runner == null
        ? runners
        : runners.includes(runner)
        ? [runner]
        : []) {
        bundleForRunner(r).addMatch({ config, files: filtered });
      }
    }
    return bundles;
  }

  runner: string;

  shouldInstrument: boolean;

  verbose: boolean;

  rollupConfig: string;

  rollupPromise: Promise<any>;

  rollupPlugins: Promise<any[]>;

  cwd: string;

  onready: string;

  matches: Set<StablercMatch>;

  constructor({
    [CliArgKey.RUNNER]: runner,
    [CliArgKey.COVERAGE]: shouldInstrument = false,
    [CliArgKey.VERBOSE]: verbose = false,
    [CliArgKey.ROLLUP]: rollupConfig = "rollup.config.js",
    [CliArgKey.WORKING_DIRECTORY]: cwd = process.cwd(),
    [CliArgKey.ONREADY]: onready = "run",
  }: BundleTaskParams) {
    this.runner = runner;
    this.shouldInstrument = !!shouldInstrument;
    this.verbose = verbose;
    this.rollupConfig = rollupConfig;
    this.cwd = cwd;
    this.rollupPromise = loadModule(join(cwd, this.rollupConfig));
    this.rollupPlugins = this.rollupPromise.then(config => config.plugins);
    this.onready = onready;
    this.matches = new Set<StablercMatch>();
  }

  addMatch(match: StablercMatch): Bundle {
    this.matches.add(match);
    return this;
  }

  async loadConfigs(pluginConfigs: [string, any][][]): Promise<LoadedConfigs> {
    const seen = new Map<string, Set<any>>();
    const configs = pluginConfigs.flatMap(matchPlugins =>
      matchPlugins.map(matchPlugin => {
        const [pluginName] = matchPlugin;

        if (!seen.has(pluginName)) {
          seen.set(pluginName, new Set<any>());
        }

        const matchedPreviously = seen.get(pluginName);

        for (const dup of matchedPreviously) {
          if (deepEqual(matchPlugin, dup)) {
            return dup;
          }
        }
        matchedPreviously.add(matchPlugin);
        return matchPlugin;
      }),
    );

    return {
      seen,
      configs,
    };
  }

  async loadPlugins(pluginConfigs: [string, any][][]): Promise<LoadedPlugins> {
    const { seen, configs } = await this.loadConfigs(pluginConfigs);

    return {
      seen,
      configs,
      plugins: new Map<any, Promise<any>>(
        [...seen.entries()].flatMap(([pluginName, configs]) =>
          [...configs].map(config => [
            config,
            instantiatePlugin(pluginName, config[1]),
          ]),
        ),
      ),
    };
  }

  async rollup(): Promise<RollupSingleFileBuild> {
    const { shouldInstrument, verbose, cwd, onready, runner } = this;
    const rollupPlugins = await this.rollupPlugins;
    const matchValues = [...this.matches.values()];
    const pluginsPromise = this.loadPlugins(
      matchValues.map(({ config }) => config.document.plugins),
    );
    const testBundlePromises: Promise<RollupBuild>[] = matchValues.map(
      ({ files }) =>
        this.rollupSpecfiles({
          files,
          shouldInstrument,
          verbose,
          rollupPlugins,
          pluginsPromise,
        }),
    );
    const [
      libraryBundle,
      runnerBundle,
      pluginModules,
      testBundles,
      tmp,
    ] = await Promise.all([
      this.libraryBundle(),
      this.runnerBundle(),
      this.awaitPlugins(pluginsPromise),
      Promise.all(testBundlePromises),
      dir({ unsafeCleanup: true }),
    ]);

    try {
      const firstPhase = [
        libraryBundle.write({
          file: join(tmp.path, "stable.js"),
          format: "esm",
          sourcemap: "inline",
        }),
        // TODO: should we only compile the runner conditionally?
        runnerBundle.write({
          file: join(tmp.path, "run.js"),
          format: "esm",
          sourcemap: "inline",
        }),
        copy(join(cwd, "plugins"), join(tmp.path, "plugins")),
      ];

      const matches = [...this.matches];

      for (const [index, { config }] of matches.entries()) {
        const pluginBundle = new Set<StablercPlugin>();

        for (const pluginConfig of config.document.plugins) {
          canonicalize: for (const c of pluginModules.configs) {
            if (!deepEqual(pluginConfig, c)) {
              continue canonicalize;
            }
            pluginBundle.add(await pluginModules.plugins.get(c));
          }
        }
        firstPhase.push(
          writeFile(
            join(tmp.path, `plugins-${index}.js`),
            codeForPlugins([...pluginBundle]),
            "utf-8",
          ),
          testBundles[index].write({
            file: join(tmp.path, `bundle-${index}.js`),
            format: "esm",
            sourcemap: "inline",
          }),
        );
      }

      const testBundle = codeForTestBundle(
        bundlerAliasForRunner(runner) ? undefined : onready,
        this.matches.size,
      );
      const testBundlePath = join(tmp.path, "index.js");

      firstPhase.push(writeFile(testBundlePath, testBundle, "utf-8"));

      await Promise.all(firstPhase);

      return await rollup({
        input: testBundlePath,
        onwarn: verbose ? verboseWarn : () => {},
        plugins: [
          thunkify({
            files: [...matches.keys()].map(i =>
              join(tmp.path, `bundle-${i}.js`),
            ),
          }),
        ],
      });
    } finally {
      tmp.cleanup();
    }
  }

  async rollupSpecfiles(params): Promise<RollupBuild> {
    return bundleFromFiles(params);
  }

  async libraryBundle(): Promise<RollupSingleFileBuild> {
    return rollup({
      input: join(__dirname, "./src/framework/lib.ts"),
      plugins: await this.rollupPlugins,
    });
  }

  async runnerBundle(): Promise<RollupSingleFileBuild> {
    const alias = bundlerAliasForRunner(this.runner);
    const entry =
      alias != null
        ? `./src/runners/${alias}/run.ts`
        : "./src/framework/run.ts";

    return rollup({
      input: resolve(__dirname, entry),
      plugins: await this.rollupPlugins,
    });
  }

  async awaitPlugins(
    pluginsPromise: Promise<LoadedPlugins>,
  ): Promise<LoadedPlugins> {
    return pluginsPromise
      .then(({ plugins }) => Promise.all(plugins.values()))
      .then(() => pluginsPromise);
  }
}
