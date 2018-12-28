const fs = require("fs");
const virtual = require("rollup-plugin-virtual");
const { rollup } = require("rollup");
const { bundle } = require("../bundle/bundle");
const { bundlePlugins } = require("../bundle/bundlePlugins");

const names = [
  "describe",
  "xdescribe",
  "fdescribe",
  "describeEach",
  "xdescribeEach",
  "fdescribeEach",
  "it",
  "xit",
  "fit",
  "beforeAll",
  "afterAll",
  "beforeEach",
  "afterEach",
  "info",
];

exports.bundleCommand = async function bundleCommand({
  config,
  files,
  rollupPlugins,
  stdinCode,
  partition,
  partitions,
  sort,
  selection,
  format,
  quiet,
  outFile = `static/bundle.js`,
}) {
  if (stdinCode) {
    throw new Error(
      "reading from stdin is not currently supported by the bundle command",
    );
  }

  const pluginsModule = await bundlePlugins(config.plugins);

  // TODO: this obviously won't work with sourcemaps so we're gonna need to figure that part out later
  const bundles = await bundlesFromFiles({
    files,
    rollupPlugins,
    pluginsModule,
    format: "iife",
  })
    .await()
    .reduce((bundle, { code }) => bundle + code, "");

  const ioc = await rollup({
    input: "testbundle",
    onwarn(message) {
      // Suppressing a very chatty and unimportant warning
      if (/is not exported by/.test(message)) {
        return;
      }
    },
    plugins: [
      virtual({
        testbundle: `
import * as plugins from "pluginbundle";
stable.dethunk(function (${names.join(
          ",",
        )}) {${bundles}}, stable.plugins(plugins)).then(stable.run)`,
      }),
      virtual({
        pluginbundle: pluginsModule,
      }),
    ],
  });

  const { code } = await ioc.generate({ format: "iife" });

  await fs.promises.writeFile(outFile, code, "utf-8");
};

function bundlesFromFiles({ files, rollupPlugins, pluginsModule, format }) {
  return bundle({ files, plugins: rollupPlugins, pluginsModule, format });
}
