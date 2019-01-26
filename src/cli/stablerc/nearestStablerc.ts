import { stat } from "../stat";
import { join, dirname } from "path";

export async function nearestStablerc(
  dir,
  rcfilename = ".stablerc",
): Promise<string> {
  do {
    try {
      const candidate = dir.endsWith(rcfilename) ? dir : join(dir, rcfilename);

      await stat(candidate);
      return candidate;
    } catch (_) {}
  } while (dir !== "/" && (dir = dirname(dir)));
}
