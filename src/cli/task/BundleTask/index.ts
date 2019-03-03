import { Task, BundleTaskParams } from "../../../interfaces";
import { writeBundle } from "./writeBundle";
import { stablercsForParams } from "../../stablerc/stablercsForParams";
import { CliArgKey } from "../../../enums";
import { Bundle } from "../../Bundle";
import { formatForRunner } from "../RunTask/formatForRunner";
import { kebab } from "../../case/kebab";
import { join, dirname, basename } from "path";

export class BundleTask implements Task {
  async run(params: BundleTaskParams) {
    const { [CliArgKey.BUNDLE_FILE]: outFile = "static/bundle.js" } = params;
    const configs = await stablercsForParams(params);
    const bundles = Bundle.fromConfigs(configs, params);

    for (const [runner, bundle] of bundles) {
      const b = await bundle.rollup();

      const outFileForRunner = `${join(
        dirname(outFile),
        basename(outFile, ".js"),
      )}-${kebab(runner)}.js`;

      await writeBundle(b, outFileForRunner, {
        ...params,
        [CliArgKey.BUNDLE_FORMAT]: formatForRunner(runner),
      });
    }
  }
}
