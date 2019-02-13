import {
  StablercFileLoadParams,
  StablercChain as StablercChainInterface,
  StablercEntry,
  StablercChainParams,
  StablercFile,
} from "../interfaces";
import { Splat } from "../types";
import { StablercFile as SimpleStablercFile } from "./StablercFile";
import { isAbsolute, join, dirname } from "path";

export class StablercChain implements StablercChainInterface {
  static loadAll = loadAll;

  static load = load;

  inheritance: StablercEntry[] = [];

  plugins: boolean;

  constructor({ inheritance, plugins = false }: StablercChainParams = {}) {
    this.inheritance = inheritance;
    this.plugins = plugins;
  }

  flat(): StablercFile {
    return new SimpleStablercFile({
      document: this.inheritance.reduce((memo, { file: { document } }) => {
        for (const key of ["plugins", "include", "exclude", "runners"]) {
          memo[key] = [].concat(memo[key], document[key]).filter(Boolean);
        }
        return memo;
      }, {}),
    });
  }
}

export async function loadAll(
  filename: Splat<string>,
  params?: StablercFileLoadParams,
): Promise<Map<string, StablercChain>> {
  const files: Map<string, StablercFile> = await SimpleStablercFile.loadAll(
    [].concat(filename),
    params,
  );

  return new Map(
    await Promise.all(
      [...files.entries()].map(
        async ([filename]) =>
          [filename, await load(filename, params, files)] as [
            string,
            StablercChain
          ],
      ),
    ),
  );
}

export async function load(
  filename: string,
  params: StablercFileLoadParams = {},
  files?: Map<string, StablercFile>,
): Promise<StablercChain> {
  if (files == null) {
    files = await SimpleStablercFile.loadAll(filename, params);
  }

  return new StablercChain({
    inheritance: [...inheritance(filename, files)],
    plugins: params.plugins,
  });
}

function* inheritance(
  filename: string,
  files: Map<string, StablercFile>,
): IterableIterator<StablercEntry> {
  const file = files.get(filename);

  yield { filename, file };

  for (const parentFilename of file.document.extends.map(path =>
    isAbsolute(path) ? path : join(dirname(filename), path),
  )) {
    yield* inheritance(parentFilename, files);
  }
}
