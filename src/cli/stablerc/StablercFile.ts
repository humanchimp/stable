import {
  StablercDocument,
  StablercFileLoadParams,
  StablercFileParams,
  StablercFile as StablercFileInterface,
} from "../interfaces";
import glob from "fast-glob";
import { readFile } from "fs-extra";
import { safeLoad } from "js-yaml";
import { join, dirname } from "path";
import { nearestStablerc } from "./nearestStablerc";

export class StablercFile implements StablercFileInterface {
  static splatDocument = splatDocument;

  static load = load;

  static loadAll = loadAll;

  document: StablercDocument;

  plugins: boolean;

  constructor({ document }: StablercFileParams) {
    this.document = splatDocument(document);
  }
}

export function splatDocument(document: StablercDocument) {
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

export async function load(
  filename: string,
  { plugins: shouldLoadPlugins = false }: StablercFileLoadParams = {},
): Promise<StablercFile> {
  const contents = await readFile(filename, "utf-8");
  const data = safeLoad(contents);

  return new StablercFile({
    document: {
      extends: data.extends,
      include: data.include,
      exclude: data.exclude,
      plugins: data.plugins,
      runners: data.runners,
    },
  });
}

export async function loadAll(
  filename,
  params: StablercFileLoadParams = {},
): Promise<Map<string, StablercFile>> {
  const stablercs: Map<string, StablercFile> = new Map();
  const moar: string[] = [];

  do {
    if (stablercs.has(filename)) {
      continue;
    }
    const stablerc: StablercFile = await load(filename, {
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
