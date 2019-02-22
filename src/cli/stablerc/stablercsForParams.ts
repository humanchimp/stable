import glob from "fast-glob";
import { createFilter } from "rollup-pluginutils";
import { resolve } from "path";
import { StablercTaskParams, StablercMatch } from "../interfaces";
import { StablercChain } from "./StablercChain";
import { stablercsForSpecs } from "./stablercsForSpecs";
import { CliArgKey } from "../enums";
import { getEntryfile } from "./getEntryfile";
import { directoryIncludeForFile } from "./directoryIncludeForFile";

export async function stablercsForParams({
  [CliArgKey.WORKING_DIRECTORY]: cwd = process.cwd(),
  [CliArgKey.REST]: explicitFiles,
}: StablercTaskParams): Promise<Map<string, StablercMatch>> {
  const specfiles = [];

  if (explicitFiles.length === 0) {
    explicitFiles.push(".");
  }
  for (const file of explicitFiles.map(file => resolve(cwd, file))) {
    const entryfile = await getEntryfile(file);
    const chain = await StablercChain.load(entryfile, {
      plugins: false,
      cwd,
    });
    const { document: entry } = chain.flat();
    const [batch, include] = await Promise.all([
      glob(entry.include, { cwd, absolute: true }),
      directoryIncludeForFile(file),
    ]);
    const filter = createFilter(include, entry.exclude);

    specfiles.push(...batch.filter(filter));
  }

  return stablercsForSpecs(specfiles);
}
