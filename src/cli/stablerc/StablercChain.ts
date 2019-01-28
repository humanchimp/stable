import {
  StablercFromFileParams,
  StablercChain as StablercChainInterface,
  StablercEntry,
  StablercChainParams,
} from "../interfaces";
import { StablercFile } from "./StablercFile";
import { isAbsolute, join, dirname } from "path";

export class StablercChain implements StablercChainInterface {
  filename: string;

  include: string[];

  exclude: string[];

  inheritance: StablercEntry[] = [];

  plugins: boolean;

  files: Map<string, StablercFile>;

  constructor({ inheritance, plugins = false }: StablercChainParams) {
    this.inheritance = inheritance;
    this.plugins = plugins;
  }

  flat(): StablercFile {
    return new StablercFile({
      filename: this.filename,
      document: this.inheritance.reduce((memo, { file: { document } }) => {
        for (const key of ["plugins", "include", "exclude", "runners"]) {
          memo[key] = [].concat(memo[key], document[key]).filter(Boolean);
        }
        return memo;
      }, {}),
    });
  }

  private static *inheritance(
    filename: string,
    files: Map<string, StablercFile>,
  ): IterableIterator<StablercEntry> {
    const file = files.get(filename);

    yield { filename, file };

    for (const parentFilename of file.document.extends.map(path =>
      isAbsolute(path) ? path : join(dirname(filename), path),
    )) {
      yield* StablercChain.inheritance(parentFilename, files);
    }
  }

  static async load(
    filename: string,
    params: StablercFromFileParams,
    files?: Map<string, StablercFile>,
  ): Promise<StablercChain> {
    if (files == null) {
      files = await StablercFile.loadAll(filename, params);
    }

    return new StablercChain({
      inheritance: [...StablercChain.inheritance(filename, files)],
      plugins: params.plugins,
    });
  }

  static async loadAll(
    filename: string,
    params: StablercFromFileParams,
    files?: Map<string, StablercFile>,
  ): Promise<Map<string, StablercChain>> {
    if (files == null) {
      files = await StablercFile.loadAll(filename, params);
    }

    return new Map(
      await Promise.all(
        [...files.entries()].map(
          async ([filename]) =>
            [filename, await StablercChain.load(filename, params, files)] as [
              string,
              StablercChain
            ],
        ),
      ),
    );
  }
}
