import { async as glob } from "fast-glob";
import { stat } from "fs-extra";
import { createFilter } from "rollup-pluginutils";
import { resolve } from "path";
import { StablercTaskParams, StablercMatch } from "../../interfaces";
import { StablercChain } from "./StablercChain";
import { stablercsForSpecs } from "./stablercsForSpecs";
import { CliArgKey } from "../../enums";
import { getEntryfile } from "./getEntryfile";
import { directoryIncludeForFile } from "./directoryIncludeForFile";
import { isStablerc } from "./isStablerc";

export async function stablercsForParams({
  [CliArgKey.WORKING_DIRECTORY]: cwd = process.cwd(),
  [CliArgKey.REST]: explicitFiles,
}: StablercTaskParams): Promise<Map<string, StablercMatch>> {
  const specfiles = [];

  if (explicitFiles.length === 0) {
    explicitFiles.push(".");
  }
  for (const file of explicitFiles.map(file => resolve(cwd, file))) {
    const stats = await stat(file);

    if (!stats.isDirectory() && !isStablerc(file)) {
      specfiles.push(file);
      continue;
    }

    const entryfile = await getEntryfile(file);
    const chain =
      entryfile === undefined
        ? StablercChain.empty()
        : await StablercChain.load(entryfile, {
            plugins: false,
            cwd,
          });
    const { document: entry } = chain.flat();
    const [batch, include] = await Promise.all([
      glob(entry.include, { cwd, absolute: true }),
      directoryIncludeForFile(file),
    ]);

    specfiles.push(...batch.filter(createFilter(include, entry.exclude)));
  }
  return stablercsForSpecs(specfiles);
}
