import { RunParams } from "./interfaces";
import { Suite } from "./suite";
import { shuffle } from "./shuffle";
import { reports } from "./reports";

export async function run(
  suites: Suite | Suite[],
  { generate = reports, perform = console.log, sort = shuffle }: RunParams,
): Promise<void> {
  suites = [].concat(suites);

  for await (const report of generate(suites, sort)) {
    perform(report);
  }
}
