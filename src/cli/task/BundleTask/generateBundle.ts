import { rollup, RollupSingleFileBuild } from "rollup";
import { join, dirname } from "path";
import { copy, writeFile, mkdirp } from "fs-extra";
import { dir } from "tmp-promise";
import sorcery from "sorcery";
import { thunkify } from "./thunkify";
import { bundleFromFiles } from "./bundleFromFiles";
import { bundlePlugins } from "./bundlePlugins";
import { codeForLibrary } from "./codeForLibrary";
import { codeForTestBundle } from "./codeForTestBundle";
import { codeForRunner } from "./codeForRunner";
import { bundlerAliasForRunner } from "../../bundlerAliasForRunner";
import { StablercFile, BundleTaskParams } from "../../../interfaces";
import { loadModule } from "../../loadModule";
import { CliArgKey } from "../../enums";

export async function generateBundle(
  files: string[],
  config: StablercFile,
  {
    [CliArgKey.COVERAGE]: shouldInstrument = false,
    [CliArgKey.VERBOSE]: verbose = false,
    [CliArgKey.ROLLUP]: rollupConfig = "rollup.config.js",
    [CliArgKey.WORKING_DIRECTORY]: cwd = process.cwd(),
    [CliArgKey.ONREADY]: onready = "run",
    [CliArgKey.RUNNER]: runner = "isolate",
  }: BundleTaskParams,
): Promise<RollupSingleFileBuild> {
  const { plugins: rollupPlugins } = await loadModule(join(cwd, rollupConfig));
  const plugins = [...(await config.loadedPlugins).values()];
  const pluginRollupPlugins = plugins
    .map(({ plugin }) => plugin.provides && plugin.provides.plugins)
    .filter(Boolean)
    .reduce((memo, thunk) => memo.concat(thunk()), []);

  const [bundle, pluginBundle, libraryBundle, runnerBundle] = await Promise.all(
    [
      bundleFromFiles({
        files,
        shouldInstrument,
        verbose,
        plugins: [...pluginRollupPlugins, ...rollupPlugins],
      }),
      bundlePlugins(plugins),
      codeForLibrary(rollupPlugins),
      codeForRunner(runner, rollupPlugins),
    ],
  );

  const tmp = await dir({ unsafeCleanup: true });

  try {
    await writeFile(join(tmp.path, "plugins.js"), pluginBundle, "utf-8");

    const bundlePath = join(tmp.path, `bundle.js`);

    await mkdirp(dirname(bundlePath));
    await bundle.write({
      file: bundlePath,
      format: "esm",
      sourcemap: "inline",
    });

    const chain = await sorcery.load(bundlePath);

    await chain.write({ inline: true });

    const testBundle = codeForTestBundle(
      bundlerAliasForRunner(runner) ? undefined : onready,
    );
    const testBundlePath = join(tmp.path, "index.js");

    await writeFile(testBundlePath, testBundle, "utf-8");

    const libraryPath = join(tmp.path, "stable.js");
    const libraryMapPath = `${libraryPath}.map`;

    await writeFile(libraryPath, libraryBundle.code, "utf-8");
    await writeFile(libraryMapPath, libraryBundle.map, "utf-8");

    const runnerPath = join(tmp.path, "run.js");
    const runnerMapPath = `${libraryPath}.map`;

    await writeFile(runnerPath, runnerBundle.code, "utf-8");
    await writeFile(runnerMapPath, runnerBundle.map, "utf-8");

    await copy(join(cwd, "plugins"), join(tmp.path, "plugins"));

    return await rollup({
      input: testBundlePath,
      onwarn: verbose
        ? warning => {
            console.warn((warning as any).message); // eslint-disable-line
          }
        : () => {},
      plugins: [thunkify({ files: [bundlePath] })],
    });
  } finally {
    await tmp.cleanup();
  }
}
