import { join } from "path";

export function defaultEntry(cwd: string): string {
  return join(cwd, ".stablerc");
}
