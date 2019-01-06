const { Suite } = require("../../lib/stable");
const { fromAsyncIterable } = require("most-async-iterable");
const { bundleCommand } = require("./bundle");
const { transformForFormat } = require("../output/helpers");
const { dir } = require("tmp-promise");
const { join, relative } = require("path");
const { readFile, writeFile, copy } = require("fs-extra");
const libReport = require('istanbul-lib-report');

exports.runCommand = async function runCommand(params) {
  const {
    partition,
    partitions,
    sort,
    selection,
    format,
    quiet,
    runner,
    outFile = join(process.cwd(), "stable-bundle.js"),
    coverage,
  } = params;
  await bundleCommand({
    ...params,
    bundleFormat: "cjs",
    outFile,
    onready: "stableRun",
  });

  const code = await readFile(outFile, "utf-8");

  const predicate =
    partition != null && partitions != null
      ? selection.partition(counts.total, partition, partitions)
      : selection.predicate;
  const { run } = implForRunner(runner);
  const transform = transformForFormat(format);

  let failed = false;

  await run(code)
    .chain(suite => fromAsyncIterable(suite.run(sort, predicate)))
    .tap(report => {
      if (report.failed > 0) {
        failed = true;
      }
    })
    .map(transform)
    .observe(console.log);

  if (coverage != null) {
    await writeFile(join('.nyc_output', 'out.json'), JSON.stringify(__coverage__), 'utf-8');
  }

  if (failed && !quiet) {
    process.exit(1); // 👋
  }
};

function implForRunner(runner) {
  switch (runner) {
    case "eval":
      return require("../runners/eval");
    case "vm":
      return require("../runners/vm");
  }
  throw new Error("unreachable: unknown runner type");
}
