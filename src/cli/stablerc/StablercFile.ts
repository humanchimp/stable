import {
  StablercDocument,
  StablercFromFileParams,
  StablercFileParams,
} from "../interfaces";
import { readFile } from "fs-extra";
import { safeLoad } from "js-yaml";
import { join, dirname } from "path";
import glob from "fast-glob";
import { nearestStablerc } from "./nearestStablerc";

export class StablercFile {
  static splatDocument(document: StablercDocument) {
    return {
      extends: splat(document.extends),
      include: splat(document.include),
      exclude: splat(document.exclude),
      plugins: document.plugins,
      runners: document.runners,
    };
    function splat(it) {
      return it ? [].concat(it) : [];
    }
  }

  filename: string;

  document: StablercDocument;

  plugins: boolean;

  constructor({ document }: StablercFileParams) {
    this.document = StablercFile.splatDocument(document);
  }

  static async load(
    filename: string,
    { plugins: shouldLoadPlugins }: StablercFromFileParams,
  ): Promise<StablercFile> {
    const contents = await readFile(filename, "utf-8");
    const data = safeLoad(contents);

    return new StablercFile({
      filename,
      document: {
        extends: data.extends,
        include: data.include,
        exclude: data.exclude,
        plugins: data.plugins,
        runners: data.runners,
      },
    });
  }

  static async loadAll(filename, params): Promise<Map<string, StablercFile>> {
    const stablercs: Map<string, StablercFile> = new Map();
    const moar: string[] = [];

    do {
      if (stablercs.has(filename)) {
        continue;
      }
      const stablerc: StablercFile = await StablercFile.load(filename, {
        ...params,
        plugins: false,
      });
      const { document } = stablerc;

      const [extend, include] = await Promise.all([
        moarFiles(filename, document.extends),
        moarFiles(filename, document.include),
      ]);

      await Promise.all(
        [include, extend].map(source => appendMoar(moar, source)),
      );

      stablercs.set(filename, stablerc);
    } while ((filename = moar.pop()));

    return stablercs;
  }
}

async function* moarFiles(relative, patterns) {
  const cwd = dirname(relative);

  for (const filename of await glob(patterns, { cwd })) {
    yield await nearestStablerc(join(cwd, filename));
  }
}

async function appendMoar(moar, source) {
  for await (const filename of source) {
    moar.push(filename);
  }
}
