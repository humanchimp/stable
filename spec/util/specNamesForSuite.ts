import { asyncSpread } from "./asyncSpread";
import { Suite } from "../../src/interfaces";

export async function specNamesForSuite(suite: Suite): Promise<string[]> {
  return (await asyncSpread(suite.reports(it => it))).map(it => it.description);
}