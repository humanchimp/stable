import { RollupBuild, RollupSingleFileBuild, rollup } from "rollup";
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
import { join } from "path";
import { bundleFromFiles } from "./task/BundleTask/bundleFromFiles";
import { bundlePlugins } from "./task/BundleTask/bundlePlugins";
import deepEqual from "fast-deep-equal";
import { dir } from "tmp-promise";
import { writeFile, copy } from "fs-extra";
import { codeForLibrary } from "./task/BundleTask/codeForLibrary";
import { codeForRunner } from "./task/BundleTask/codeForRunner";
import { instantiatePlugin } from "./stablerc/instantiatePlugin";
import { codeForTestBundle } from "./task/BundleTask/codeForTestBundle";
import { bundlerAliasForRunner } from "./bundlerAliasForRunner";
import { thunkify } from "./task/BundleTask/thunkify";

export class Bundle implements BundleInterface {
  runner: string;

  matches: Set<StablercMatch>;

  constructor(runner: string) {
    this.runner = runner;
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

  async rollup({
    [CliArgKey.COVERAGE]: shouldInstrument = false,
    [CliArgKey.VERBOSE]: verbose = false,
    [CliArgKey.ROLLUP]: rollupConfig = "rollup.config.js",
    [CliArgKey.WORKING_DIRECTORY]: cwd = process.cwd(),
    [CliArgKey.RUNNER]: runner = "isolate",
    [CliArgKey.ONREADY]: onready = "run",
  }: BundleTaskParams): Promise<RollupSingleFileBuild> {
    const { plugins: rollupPlugins } = await loadModule(
      join(cwd, rollupConfig),
    );
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
      this.libraryOutput(rollupPlugins),
      this.runnerOutput(rollupPlugins),
      pluginsPromise
        .then(({ plugins }) => Promise.all(plugins.values()))
        .then(() => pluginsPromise),
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
            bundlePlugins([...pluginBundle]),
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
        onwarn: verbose
          ? warning => {
              console.warn((warning as any).message); // eslint-disable-line
            }
          : () => {},
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

  async libraryOutput(plugins): Promise<RollupSingleFileBuild> {
    return codeForLibrary(plugins);
  }

  async runnerOutput(plugins): Promise<RollupSingleFileBuild> {
    return codeForRunner(this.runner, plugins);
  }
}
