import { StablercFile } from "../interfaces";
import { load } from "./StablercChain";
import { nearestStablerc } from "./nearestStablerc";
import { dirname, join } from "path";

export async function stablercsForSpecs(
  specfiles: string[],
  prefix: string = "",
): Promise<
  Map<
    string,
    {
      config: StablercFile;
      files: string[];
    }
  >
> {
  const byStablerc = new Map<
    string,
    { config: StablercFile; files: string[] }
  >();
  const byDir = new Map<string, string>();

  for (const rawSpecfile of specfiles) {
    const specfile = join(prefix, rawSpecfile);
    const dir = dirname(specfile);
    const filename = await (async () => {
      if (byDir.has(dir)) {
        return byDir.get(dir);
      }
      const filename = await nearestStablerc(dir);

      byDir.set(dirname(filename), filename);
      return filename;
    })();

    if (byStablerc.has(filename)) {
      const entry = byStablerc.get(filename);

      entry.files.push(specfile);
    } else {
      const chain = await load(filename);
      const config = chain.flat().withPlugins();

      byStablerc.set(filename, {
        config,
        files: [specfile],
      });
    }
  }
  return byStablerc;
}
