import {
  StablercDocument,
  StablercFileLoadParams,
  StablercFileParams,
  StablercFile as StablercFileInterface,
  StablercPlugin,
} from "../interfaces";
import glob from "fast-glob";
import { readFile } from "fs-extra";
import { safeLoad } from "js-yaml";
import { join, dirname } from "path";
import { nearestStablerc } from "./nearestStablerc";
import { stablercsForSpecs } from "./stablercsForSpecs";
import { instantiatePlugins } from "./instantiatePlugins";
import { Splat, StablercPluginDefinition } from "../types";

export class StablercFile implements StablercFileInterface {
  static nearest = nearestStablerc;

  static forSpecs = stablercsForSpecs;

  static splatDocument = splatDocument;

  static load = load;

  static loadAll = loadAll;

  document: StablercDocument;

  plugins: boolean;

  loadedPlugins: Promise<Map<any, StablercPlugin>>;

  constructor({ document, plugins }: StablercFileParams) {
    this.document = splatDocument(document, plugins);
    if (plugins) {
      this.loadedPlugins = instantiatePlugins(new Map(document.plugins));
    }
    this.plugins = plugins;
  }

  withPlugins() {
    if (this.plugins) {
      return this;
    }
    return new StablercFile({
      plugins: true,
      document: this.document,
    });
  }
}

export function splatDocument(document: StablercDocument, plugins: boolean) {
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
    plugins: shouldLoadPlugins,
  });
}

export function loadAll(
  filename: string,
  params: StablercFileLoadParams,
): Promise<Map<string, StablercFile>>;
export function loadAll(
  filename: string[],
  params: StablercFileLoadParams,
): Promise<Map<string, StablercFile>>;
export async function loadAll(
  filename: Splat<string>,
  params: StablercFileLoadParams = {},
): Promise<Map<string, StablercFile>> {
  const stablercs: Map<string, StablercFile> = new Map();
  let [current, ...moar]: string[] = [].concat(filename);

  do {
    if (stablercs.has(current)) {
      continue;
    }
    const stablerc: StablercFile = await load(current, {
      ...params,
      plugins: false,
    });
    const { document } = stablerc;

    const [extend, include] = await Promise.all([
      moarFiles(current, document.extends),
      moarFiles(current, document.include),
    ]);

    await Promise.all(
      [include, extend].map(source => appendMoar(moar, source)),
    );

    stablercs.set(current, stablerc);
  } while ((current = moar.pop()));

  return stablercs;
}

async function* moarFiles(relative, patterns) {
  const cwd = dirname(relative);

  for (const filename of await glob(patterns, { cwd })) {
    yield await nearestStablerc(join(cwd, filename));
  }
}

async function appendMoar(
  moar: string[],
  source: AsyncIterableIterator<string>,
) {
  for await (const filename of source) {
    moar.push(filename);
  }
}
