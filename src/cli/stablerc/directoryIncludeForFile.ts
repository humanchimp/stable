import { resolve, dirname } from "path";
import { stat } from "fs-extra";

export async function directoryIncludeForFile(file: string): Promise<string> {
  const stats = await stat(file);

  return resolve(stats.isDirectory() ? file : dirname(file), "**");
}
