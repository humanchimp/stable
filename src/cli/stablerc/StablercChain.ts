import { join, dirname } from "path";
import glob from "fast-glob";
import {
  StablercFromFileParams,
  StablercChain as StablercChainInterface,
  StablercEntry,
} from "../interfaces";
import { Stablerc } from "./Stablerc";
import { nearestStablerc } from "./nearestStablerc";

export class StablercChain implements StablercChainInterface {
  filename: string;

  include: string[];

  exclude: string[];

  stablercs: StablercEntry[] = [];

  plugins: boolean;

  files: Map<string, Stablerc>;

  add(entry: StablercEntry): StablercChain {
    this.stablercs.push(entry);
    return this;
  }

  flat(): Stablerc {
    return new Stablerc({
      filename: this.filename,
      document: this.stablercs.reduce((memo, { document }) => {
        for (const key of ["plugins", "includes", "excludes", "runners"]) {
          if (document[key] != null) {
            memo[key] = document[key];
          }
        }
        return memo;
      }, {}),
    });
  }

  static async fromFile(
    filename: string,
    params: StablercFromFileParams,
  ): Promise<StablercChain> {
    const chain: StablercChain = new StablercChain();
    const stablercs: Map<string, Stablerc> = new Map();
    const moar: string[] = [];

    do {
      if (stablercs.has(filename)) {
        continue;
      }
      const stablerc: Stablerc = await Stablerc.fromFile(filename, {
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

    console.log(stablercs);

    // for(;;){
    //   const stablerc: Stablerc = await Stablerc.fromFile(filename, params);
    //   const { document } = stablerc;

    //   // if (document.include) {
    //   //   moar.push(...await glob(document.include));
    //   // }

    //   if (document.extends != null && document.extends.length > 0) {
    //     const extend = []
    //       .concat(document.extends)
    //       .map(f => join(dirname(filename), f));

    //     moar.push(...extend);
    //     chain.add({
    //       filename,
    //       document,
    //     });

    //   }
    // }

    return chain;
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
    console.log(filename);
    moar.push(filename);
  }
}
