import { defaultEntry } from "./defaultEntry";
import { stat } from "fs-extra";
import { isAbsolute, join, dirname } from "path";

export function getEntryfile(cwd: string): Promise<string>;
export function getEntryfile(cwd: string, entry: string): Promise<string>;
export async function getEntryfile(
  cwd: string,
  entry?: string,
): Promise<string> {
  if (entry === undefined) {
    return defaultEntry(cwd);
  }
  if (!isAbsolute(entry)) {
    entry = join(cwd, entry);
  }
  if (entry.endsWith(".stablerc")) {
    return entry;
  }
  const stats = await stat(entry);

  return join(stats.isDirectory() ? entry : dirname(entry), ".stablerc");
}
