const fs = require("fs");
const { bundle } = require("../bundle/helpers");

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

  // TODO: this obviously won't work with sourcemaps so we're gonna need to figure that part out later
  const bundles = await bundlesFromFiles({ files, rollupPlugins })
    .await()
    .reduce((bundle, { code }) => bundle + code, "");

  await fs.promises.writeFile(
    outFile,
    `stable.dethunk(function (${names.join(
      ",",
    )}) {${bundles}}).then(stable.run);`,
    "utf-8",
  );
};

function bundlesFromFiles({ files, rollupPlugins }) {
  return bundle({ files, plugins: rollupPlugins });
}
