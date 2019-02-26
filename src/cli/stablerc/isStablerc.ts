import { extensions } from "./extensions";

export function isStablerc(entry: string): boolean {
  return extensions.some(extension => entry.endsWith(`.stablerc${extension}`));
}
