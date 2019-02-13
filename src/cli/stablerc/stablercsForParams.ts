import glob from "fast-glob";
import { relative, dirname, isAbsolute, join } from "path";
import { BundleTaskParams } from "../interfaces";
import { StablercChain } from "./StablercChain";
import { stablercsForSpecs } from "./stablercsForSpecs";
import { CliArgKey } from "../enums";

export async function stablercsForParams({
  [CliArgKey.WORKING_DIRECTORY]: cwd = process.cwd(),
  [CliArgKey.REST]: explicitFiles = [],
}: BundleTaskParams) {
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
  return stablercsForSpecs(specfiles, prefix);
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

function defaultEntry(cwd: string): string {
  return join(cwd, ".stablerc");
}
