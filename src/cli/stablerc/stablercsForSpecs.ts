import { StablercMatch } from "../../interfaces";
import { load, StablercChain } from "./StablercChain";
import { nearestStablerc } from "./nearestStablerc";
import { dirname } from "path";

export async function stablercsForSpecs(
  specfiles: string[],
): Promise<Map<string, StablercMatch>> {
  const byStablerc = new Map<string, StablercMatch>();
  const byDir = new Map<string, string>();

  specs: for (const specfile of specfiles) {
    const dir = dirname(specfile);
    const filename = await (async () => {
      if (byDir.has(dir)) {
        return byDir.get(dir);
      }
      const filename = await nearestStablerc(dir);

      if (filename !== undefined) {
        byDir.set(dirname(filename), filename);
      }
      return filename;
    })();

    if (byStablerc.has(filename)) {
      const entry = byStablerc.get(filename);

      entry.files.push(specfile);
    } else {
      const chain =
        filename === undefined ? StablercChain.empty() : await load(filename);
      const config = chain.flat();

      byStablerc.set(filename, {
        config,
        files: [specfile],
      });
    }
  }
  return byStablerc;
}
