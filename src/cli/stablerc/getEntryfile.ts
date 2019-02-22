import { stat } from "fs-extra";
import { dirname } from "path";
import { nearestStablerc } from "./nearestStablerc";
import { isStablerc } from "./isStablerc";

export async function getEntryfile(entry?: string): Promise<string> {
  const explicit = isStablerc(entry);

  // Calling stat early so that we consistently throw on non-existent directories
  const stats = await stat(explicit ? dirname(entry) : entry);

  if (explicit) {
    return entry;
  }
  if (stats.isDirectory()) {
    return nearestStablerc(entry);
  }
  return nearestStablerc(dirname(entry));
}
