import { join } from "path";
import { readFile, writeFile } from "fs-extra";
import { tmpName } from "tmp-promise";
import { Task, RunTaskParams } from "../../../interfaces";
import { implForRunner } from "./implForRunner";
import { transformForFormat } from "../../output/transformForFormat";
import { CliArgKey, StreamFormat } from "../../../enums";
import { stablercsForParams } from "../../stablerc/stablercsForParams";
import { writeBundle } from "../BundleTask/writeBundle";
import { formatForRunner } from "./formatForRunner";
import { Bundle } from "../../Bundle";

export class RunTask implements Task {
  async run(params) {
    const {
      [CliArgKey.QUIET]: quiet,
      [CliArgKey.OUTPUT_FORMAT]: format = StreamFormat.TAP,
      [CliArgKey.BUNDLE_FILE]: outFileParam,
      [CliArgKey.COVERAGE]: coverage,
    }: RunTaskParams = params;
    const bundles = Bundle.fromConfigs(await stablercsForParams(params), {
      ...params,
      [CliArgKey.ONREADY]: "stableRun",
    });
    let failed = false;

    for (const [runner, bundle] of bundles) {
      const outFile = outFileParam != null ? outFileParam : await tmpName();

      const b = await bundle.rollup();

      await writeBundle(b, outFile, {
        ...params,
        [CliArgKey.BUNDLE_FORMAT]: formatForRunner(runner),
      });

      const code = await readFile(outFile, "utf-8");
      const run = implForRunner(runner);
      const transform = transformForFormat(format);

      await run(code, { ...params, runner })
        .tap(report => {
          if (report.failed > 0) {
            failed = true;
          }
        })
        .map(transform)
        .observe(console.log); // eslint-disable-line

      if (coverage != null && typeof global["__coverage__"] !== "undefined") {
        await writeFile(
          join(".nyc_output", "out.json"),
          JSON.stringify(global["__coverage__"]),
          "utf-8",
        );
      }
    }

    if (failed && !quiet) {
      process.exit(1); // 👋
    }
  }
}
