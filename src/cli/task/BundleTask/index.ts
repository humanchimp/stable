import { join, dirname, basename } from "path";
import { Task, BundleTaskParams } from "../../interfaces";
import { generateBundle } from "./generateBundle";
import { writeBundle } from "./writeBundle";
import { stablercsForParams } from "../../stablerc/stablercsForParams";
import { CliArgKey } from "../../enums";

export class BundleTask implements Task {
  async run(params: BundleTaskParams) {
    const { [CliArgKey.BUNDLE_FILE]: outFile = "static/bundle.js" } = params;
    const configs = await stablercsForParams(params);
    let count = 0;

    for (const { config, files } of configs.values()) {
      const bundle = await generateBundle(files, config, params);
      const filename =
        count === 0
          ? outFile
          : `${join(dirname(outFile), basename(outFile, ".js"))}-${count}.js`;

      await writeBundle(bundle, filename, params);
      count += 1;
    }
  }
}
