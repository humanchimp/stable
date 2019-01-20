const { bundleCommand } = require("./bundle");
const { transformForFormat } = require("../output/helpers");
const { join } = require("path");
const { readFile, writeFile } = require("fs-extra");
const { tmpName } = require("tmp-promise");

exports.runCommand = async function runCommand(params) {
  const {
    bundles,
    partition,
    partitions,
    selection,
    format,
    quiet,
    runner,
    outFile: outFileParam,
    coverage,
    verbose,
    defaultRunner,
  } = params;
  let failed = false;
  for (const [config, files] of bundles.entries()) {
    const outFile = outFileParam != null ? outFileParam : await tmpName();

    const runners =
      runner == null
        ? config.runners == null || config.runners.length === 0
          ? [defaultRunner]
          : config.runners
        : [runner];

    for (const runner of runners) {
      await bundleCommand({
        ...params,
        config,
        runner,
        files,
        bundleFormat:
          runner === "remote" || runner === "headless chrome" ? "iife" : "cjs",
        outFile,
        onready: "stableRun",
        verbose,
      });

      const code = await readFile(outFile, "utf-8");

      const predicate =
        partition != null && partitions != null
          ? selection.partition(counts.total, partition, partitions)
          : selection.predicate;
      const { run } = implForRunner(runner);
      const transform = transformForFormat(format);

      await run(code, { ...params, runner, predicate })
        .tap(report => {
          if (report.failed > 0) {
            failed = true;
          }
        })
        .map(transform)
        .observe(console.log);

      if (coverage != null && typeof __coverage__ !== "undefined") {
        await writeFile(
          join(".nyc_output", "out.json"),
          JSON.stringify(__coverage__),
          "utf-8",
        );
      }
    }
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
    case "isolate": // This is cheating for now
      return require("../runners/vm");
    case "remote":
    case "headless chrome": // This is cheating for now
      return require("../runners/remote");
  }
  throw new Error(`unknown runner type: "${runner}"`);
}
