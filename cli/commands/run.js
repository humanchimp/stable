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
  } = params;
  let failed = false;
  for (const [config, files] of bundles.entries()) {
    const outFile = outFileParam != null ? outFileParam : await tmpName();

    await bundleCommand({
      ...params,
      config,
      files,
      bundleFormat: runner === "remote" ? "iife" : "cjs",
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

    await run(code, { ...params, predicate })
      .tap(report => {
        if (report.failed > 0) {
          failed = true;
        }
      })
      .map(transform)
      .observe(console.log)
      .catch(console.error);

    if (coverage != null && typeof __coverage__ !== "undefined") {
      await writeFile(
        join(".nyc_output", "out.json"),
        JSON.stringify(__coverage__),
        "utf-8",
      );
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
      return require("../runners/vm");
    case "remote":
      return require("../runners/remote");
  }
  throw new Error("unreachable: unknown runner type");
}
