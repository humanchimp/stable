import { StablercChainParams, StablercEntry } from "../interfaces";
import glob from "fast-glob";
import { dirname, join } from "path";
import { StablercChain } from "./StablercChain";
import { nearestStablerc } from "./nearestStablerc";

export async function loadMap(
  filename: string,
  params: StablercChainParams,
): Promise<Map<string, StablercChain>> {
  const chains = await StablercChain.loadAll(filename, params);
  const relativeIncludes = chains
    .get(filename)
    .inheritance.filter(
      ({
        file: {
          document: { include },
        },
      }) => include.length > 0,
    )
    .map(({ filename, file: { document: { include } } }) => ({
      include,
      cwd: dirname(filename),
    }));
  const specFiles = [
    ...new Set([
      ...(await Promise.all(
        relativeIncludes.map(async ({ include, cwd }) => ({
          cwd,
          include,
          files: await glob(include, { cwd }),
        })),
      )).reduce(
        (memo, { cwd, files }) =>
          memo.concat(files.map(file => join(cwd, file))),
        [],
      ),
    ]),
  ];
  const map: Map<string, StablercChain> = new Map(
    await Promise.all(
      specFiles.map(
        async specFile =>
          [specFile, chains.get(await nearestStablerc(specFile))] as [
            string,
            StablercChain
          ],
      ),
    ),
  );

  return map;
}