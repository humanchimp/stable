import { join, isAbsolute, dirname, relative } from "path";
import glob from "fast-glob";
import { Task, BundleTaskParams } from "../../interfaces";
import { StablercChain } from "../../stablerc/StablercChain";
import { generateBundle } from "./generateBundle";
import { stablercsForSpecs } from "../../stablerc/stablercsForSpecs";

export class BundleTask implements Task {
  async run(params: BundleTaskParams) {
    const {
      "working-directory": cwd = process.cwd(),
      rest: explicitFiles,
    } = params;
    if (explicitFiles.length > 1) {
      throw new Error(
        "bundle command takes as its only positional parameter a .stablerc entrypoint",
      );
    }
    const entryfile = getEntryfile(cwd, explicitFiles[0]);
    const chain = await StablercChain.load(entryfile, {
      plugins: false,
    });
    const { document: entry } = chain.flat();
    const specfiles = [];
    const prefix = relative(cwd, dirname(entryfile));

    for (const include of entry.include) {
      specfiles.push(...(await glob(include, { cwd: dirname(entryfile) })));
    }

    const configs = await stablercsForSpecs(specfiles, prefix);

    for (const { config, files } of configs.values()) {
      const bundle = await generateBundle(files, config, params);
      console.log(bundle);
    }
    // console.log(bundle);
  }
}

function defaultEntry(cwd: string): string {
  return join(cwd, ".stablerc");
}

function getEntryfile(cwd: string, entry: string): string {
  if (entry === undefined) {
    return defaultEntry(cwd);
  }
  if (!isAbsolute(entry)) {
    entry = join(cwd, entry);
  }
  return entry.endsWith(".stablerc") ? entry : join(entry, ".stablerc");
}
