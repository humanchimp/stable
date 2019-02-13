import { join, isAbsolute, dirname, relative, basename } from "path";
import glob from "fast-glob";
import { Task, BundleTaskParams } from "../../interfaces";
import { StablercChain } from "../../stablerc/StablercChain";
import { generateBundle } from "./generateBundle";
import { stablercsForSpecs } from "../../stablerc/stablercsForSpecs";
import { CliArgKey } from "../../enums";
import sorcery from "sorcery";

export class BundleTask implements Task {
  async run(params: BundleTaskParams) {
    const {
      [CliArgKey.WORKING_DIRECTORY]: cwd = process.cwd(),
      [CliArgKey.REST]: explicitFiles = [],
      [CliArgKey.BUNDLE_FILE]: outFile = "static/bundle.js",
      [CliArgKey.BUNDLE_FORMAT]: bundleFormat = "iife",
      [CliArgKey.VERBOSE]: verbose = false,
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
    let count = 0;

    for (const { config, files } of configs.values()) {
      const bundle = await generateBundle(files, config, params);
      const filename =
        count === 0
          ? outFile
          : `${join(dirname(outFile), basename(outFile, ".js"))}-${count}.js`;

      await bundle.write({
        file: filename,
        format: bundleFormat,
        sourcemap: "inline",
        globals: {
          sinon: "sinon",
          chai: "chai",
        },
        sourcemapPathTransform(path) {
          return join(__dirname, "../..", basename(path));
        },
      });

      const chain = await sorcery.load(outFile);

      await chain.write();

      if (verbose) {
        console.log(`bundle written: ${filename}`);
      }
      count += 1;
    }
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
