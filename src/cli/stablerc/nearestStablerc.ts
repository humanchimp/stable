import { stat } from "fs-extra";
import { join, dirname } from "path";

export async function nearestStablerc(dir: string): Promise<string> {
  do {
    try {
      const candidate = dir.endsWith(".stablerc")
        ? dir
        : join(dir, ".stablerc");

      await stat(candidate);
      return candidate;
    } catch (_) {
      // hard pass
    }
  } while (dir !== "/" && (dir = dirname(dir)));
}
