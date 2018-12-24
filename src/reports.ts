import { Suite, Report, Sorter } from "./interfaces";
import { shuffle } from "./shuffle";
import { describe } from "./describe";

export async function* reports(
  suites: Suite | Suite[],
  sort: Sorter = shuffle,
): AsyncIterableIterator<Report> {
  suites = [].concat(suites);

  const suite = suites.reduce((memo, suite) => {
    memo.suites.push(suite);
    return memo;
  }, describe(null));

  for await (const result of suite.reports(sort)) {
    yield result;
  }
}
