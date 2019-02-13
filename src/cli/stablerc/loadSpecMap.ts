import glob from "fast-glob";
import { dirname, join } from "path";
import { StablercChain } from "./StablercChain";
import { nearestStablerc } from "./nearestStablerc";
import { StablercFile } from "./StablercFile";
import { loadStablercMap } from "./loadStablercMap";

export async function loadSpecMap(
  chains: Map<string, StablercChain>,
  filename: string,
): Promise<Map<string, StablercFile>> {
  const flattened = loadStablercMap(chains);
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
