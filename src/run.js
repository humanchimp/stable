import { shuffle } from "./shuffle";
import { reports } from "./reports";

export async function run(
  suites,
  { generate = reports, perform = console.log, sort = shuffle },
) {
  suites = [].concat(suites);

  for await (const report of generate(suites, sort)) {
    perform(report);
  }
}
