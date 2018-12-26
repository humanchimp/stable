import { RunParams } from "./interfaces";
import { Suite } from "./suite";
import { shuffle } from "./shuffle";
import { reports } from "./reports";

export async function run(
  suites: Suite | Suite[],
  { generate = reports, perform = console.log, sort = shuffle }: RunParams = {},
): Promise<void> {
  for await (const report of generate([].concat(suites), sort)) {
    perform(report);
  }
}
