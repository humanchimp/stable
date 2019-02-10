import { rollup } from "rollup";
import { join, dirname } from "path";
import { copy, writeFile, mkdirp } from "fs-extra";
import { dir } from "tmp-promise";
import sorcery from "sorcery";
import { mungePlugins } from "./mungePlugins";
import { thunkify } from "./thunkify";
import { bundleFromFiles } from "./bundleFromFiles";
import { bundlePlugins } from "./bundlePlugins";
import { codeForLibrary } from "./codeForLibrary";
import { codeForTestBundle } from "./codeForTestBundle";

export async function generateBundle(
  files,
  { config, rollupPlugins, coverage: shouldInstrument, onready, verbose },
) {
  const plugins = mungePlugins(config.plugins);

  const pluginRollupPlugins = plugins
    .map(plugin => plugin.provides && plugin.provides.plugins)
    .filter(Boolean)
    .reduce((memo, thunk) => memo.concat(thunk()), []);

  const [bundle, pluginBundle, libraryBundle] = await Promise.all([
    bundleFromFiles({
      files,
      shouldInstrument,
      verbose,
      plugins: [...pluginRollupPlugins, ...rollupPlugins],
    }),
    bundlePlugins(plugins),
    codeForLibrary(rollupPlugins),
  ]);

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

    const testBundle = codeForTestBundle(onready);
    const testBundlePath = join(tmp.path, "index.js");

    await writeFile(testBundlePath, testBundle, "utf-8");

    const libraryPath = join(tmp.path, "stable.js");
    const libraryMapPath = `${libraryPath}.map`;

    await writeFile(libraryPath, libraryBundle.code, "utf-8");
    await writeFile(libraryMapPath, libraryBundle.map, "utf-8");

    await copy(join(__dirname, "../../plugins"), join(tmp.path, "plugins"));

    return await rollup({
      input: testBundlePath,
      onwarn: verbose ? console.warn : () => {},
      plugins: [thunkify({ files: [bundlePath] })],
    });
  } finally {
    await tmp.cleanup();
  }
}
