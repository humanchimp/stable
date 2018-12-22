import { Suite, Report, Sorter } from "./interfaces";
import { shuffle } from "./shuffle";

export async function* reports(
  suites: Suite | Suite[],
  sort: Sorter = shuffle,
): AsyncIterableIterator<Report> {
  suites = [].concat(suites);

  for (const suite of sort([...suites])) {
    for await (const result of suite.reports(sort)) {
      yield result;
    }
  }
}
