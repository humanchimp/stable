import { stat } from "fs-extra";
import { dirname, join } from "path";
import { isStablerc } from "./isStablerc";
import { extensions } from "./extensions";

export async function nearestStablerc(dir: string): Promise<string> {
  do {
    for (const candidate of [
      ...(isStablerc(dir) ? [dir] : []),
      ...extensions.map(extension => join(dir, `.stablerc${extension}`)),
    ]) {
      try {
        await stat(candidate);
        return candidate;
      } catch (_) {
        // hard pass
      }
    }
  } while (dir !== "/" && (dir = dirname(dir)));
}
