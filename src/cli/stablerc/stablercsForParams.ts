import glob from "fast-glob";
import { relative, dirname, join } from "path";
import { StablercTaskParams, StablercMatch } from "../interfaces";
import { StablercChain } from "./StablercChain";
import { stablercsForSpecs } from "./stablercsForSpecs";
import { CliArgKey } from "../enums";
import { getEntryfile } from "./getEntryfile";

export async function stablercsForParams({
  [CliArgKey.WORKING_DIRECTORY]: cwd = process.cwd(),
  [CliArgKey.REST]: explicitFiles,
}: StablercTaskParams): Promise<Map<string, StablercMatch>> {
  if (explicitFiles.length > 1) {
    throw new Error(
      "bundle command takes as its only positional parameter a .stablerc entrypoint",
    );
  }
  const entryfile = await getEntryfile(cwd, explicitFiles[0]);
  const chain = await StablercChain.load(entryfile, {
    plugins: false,
    cwd,
  });
  const { document: entry } = chain.flat();
  const specfiles = [];
  const prefix = cwd;//join(cwd, relative(cwd, dirname(entryfile)));

  for (const include of entry.include) {
    specfiles.push(...(await glob(include, { cwd })));
  }
  debugger;
  return stablercsForSpecs(specfiles, prefix);
}
