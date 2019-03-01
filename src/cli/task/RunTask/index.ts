import { join } from "path";
import { readFile, writeFile } from "fs-extra";
import { tmpName } from "tmp-promise";
import { Task, RunTaskParams } from "../../../interfaces";
import { generateBundle } from "../BundleTask/generateBundle";
import { implForRunner } from "./implForRunner";
import { transformForFormat } from "../../output/transformForFormat";
import { CliArgKey, StreamFormat } from "../../enums";
import { stablercsForParams } from "../../stablerc/stablercsForParams";
import { writeBundle } from "../BundleTask/writeBundle";
import { formatForRunner } from "./formatForRunner";

export class RunTask implements Task {
  async run(params) {
    const {
      [CliArgKey.QUIET]: quiet,
      [CliArgKey.RUNNER]: runner,
      [CliArgKey.OUTPUT_FORMAT]: format = StreamFormat.TAP,
      [CliArgKey.BUNDLE_FILE]: outFileParam,
      [CliArgKey.COVERAGE]: coverage,

      defaultRunner,
    }: RunTaskParams = params;
    const configs = await stablercsForParams(params);
    let failed = false;

    for (const { config, files } of configs.values()) {
      const outFile = outFileParam != null ? outFileParam : await tmpName();
      const { document } = config;

      const runners = (() => {
        if (document.runners == null || document.runners.length === 0) {
          return [defaultRunner];
        }
        if (runner == null) {
          return document.runners;
        }
        if (document.runners.includes(runner)) {
          return [runner];
        }
        return [];
      })();

      for (const runner of runners) {
        const bundle = await generateBundle(files, config, {
          ...params,
          runner,
          [CliArgKey.ONREADY]: "stableRun",
        });

        await writeBundle(bundle, outFile, {
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
    }

    if (failed && !quiet) {
      process.exit(1); // 👋
    }
  }
}
