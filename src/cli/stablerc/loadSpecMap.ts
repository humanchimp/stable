import { StablercChainParams, StablercEntry } from "../interfaces";
import glob from "fast-glob";
import { dirname, join } from "path";
import { StablercChain } from "./StablercChain";
import { nearestStablerc } from "./nearestStablerc";
import { StablercFile } from "./StablercFile";

export async function loadSpecMap(
  filename: string,
  params: StablercChainParams,
): Promise<Map<string, StablercFile>> {
  const chains = await StablercChain.loadAll(filename, params);
  const flattened = new Map(
    [...chains.entries()].map(
      ([filename, chain]) => [filename, chain.flat()] as [string, StablercFile],
    ),
  );
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
      include: include,
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
        (memo: string[], { cwd, files }) =>
          memo.concat(files.map(file => join(cwd, file))),
        [],
      ),
    ]),
  ];
  const map: Map<string, StablercFile> = new Map(
    await Promise.all(
      specFiles.map(
        async specFile =>
          [specFile, flattened.get(await nearestStablerc(specFile))] as [
            string,
            StablercFile
          ],
      ),
    ),
  );

  return map;
}
