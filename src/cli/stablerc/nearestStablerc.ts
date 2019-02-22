import { stat } from "fs-extra";
import { join, dirname } from "path";
import { isStablerc } from "./isStablerc";

export async function nearestStablerc(dir: string): Promise<string> {
  do {
    try {
      const candidate = isStablerc(dir) ? dir : join(dir, ".stablerc");

      await stat(candidate);
      return candidate;
    } catch (_) {
      // hard pass
    }
  } while (dir !== "/" && (dir = dirname(dir)));
}
