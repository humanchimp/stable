const { Suite } = require("../../lib/stable");
const { fromAsyncIterable } = require("most-async-iterable");
const { generateBundle } = require("./bundle");
const { transformForFormat } = require("../output/helpers");

exports.runCommand = async function runCommand(params) {
  const {
    partition,
    partitions,
    sort,
    selection,
    format,
    quiet,
    runner,
  } = params;
  const bundle = await generateBundle({ ...params, onready: "stableRun" });
  const { code } = await bundle.generate({
    format: "cjs",
  });
  const predicate =
    partition != null && partitions != null
      ? selection.partition(counts.total, partition, partitions)
      : selection.predicate;
  const { run } = implForRunner(runner);
  const transform = transformForFormat(format);

  let failed = false;

  await run(code)
    .chain(suites => fromAsyncIterable(Suite.from(suites).run(sort, predicate)))
    .tap(report => {
      if (report.failed > 0) {
        failed = true;
      }
    })
    .map(transform)
    .observe(console.log);

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
