import { join } from "path";
import glob from "fast-glob";
import { Task, BundleTaskParams } from "../../interfaces";
import { StablercChain } from "../../stablerc/StablercChain";
import { generateBundle } from "./generateBundle";

export class BundleTask implements Task {
  async run(params: BundleTaskParams) {
    const {
      "working-directory": cwd = process.cwd(),
      rest: explicitFiles,
    } = params;
    const chain = await StablercChain.load(join(cwd, ".stablerc"), {
      plugins: false,
    });
    const { document: entry } = chain.flat();
    const files = [];

    for (const include of explicitFiles.length > 0
      ? explicitFiles
      : entry.include) {
      files.push(...(await glob(include)));
    }

    const bundle = await generateBundle(files, params);
    console.log(bundle);
  }
}
