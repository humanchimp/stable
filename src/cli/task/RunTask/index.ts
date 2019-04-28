import { readFile } from "fs-extra";
import { tmpName } from "tmp-promise";
import { Task, RunTaskParams, Report } from "../../../interfaces";
import { implForRunner } from "./implForRunner";
import { transformForFormat } from "../../output/transformForFormat";
import { CliArgKey, StreamFormat } from "../../../enums";
import { stablercsForParams } from "../../stablerc/stablercsForParams";
import { writeBundle } from "../BundleTask/writeBundle";
import { formatForRunner } from "./formatForRunner";
import { Bundle } from "../../Bundle";
import { of } from "most";
import { skipped } from "./skipped";

export class RunTask implements Task {
  async run(params) {
    const {
      [CliArgKey.QUIET]: quiet,
      [CliArgKey.OUTPUT_FORMAT]: format = StreamFormat.TAP,
      [CliArgKey.BUNDLE_FILE]: outFileParam,
      [CliArgKey.HIDE_SKIPS]: hideSkips = "focus",
      [CliArgKey.FAIL_FAST]: failFast = true,
    }: RunTaskParams = params;
    const bundles = await Bundle.fromConfigs(await stablercsForParams(params), {
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
        .filter(report => {
          switch (hideSkips) {
            case true:
              return !skipped(report);
            case "focus": {
              return !skipped(report) || !report.suite.isFocusMode;
            }
          }
        })
        .recoverWith(reason =>
          of({
            description: "recovered with reason",
            ok: false,
            reason,
          } as Report),
        )
        .tap(report => {
          if (report.ok === false) {
            failed = true;
          }
        })
        .map(transform)
        .observe(console.log); // eslint-disable-line

      if (failed && failFast) {
        break;
      }
    }

    if (failed && !quiet) {
      process.exit(1); // 👋
    }
  }
}
