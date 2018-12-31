import {
  RunParams,
  Sorter,
  Plan,
  Report,
  Summary,
  JobPredicate,
} from "./interfaces";
import { Suite } from "./Suite";
import { shuffle } from "./shuffle";

export async function run(
  suites: Suite | Suite[],
  {
    generate = generator,
    perform = console.log,
    sort = shuffle,
    predicate,
  }: RunParams = {},
): Promise<void> {
  for await (const report of generate([].concat(suites), sort, predicate)) {
    perform(report);
  }
}

export async function* generator(
  suites: Suite | Suite[],
  sort: Sorter = shuffle,
  predicate: JobPredicate,
): AsyncIterableIterator<Plan | Report | Summary> {
  yield* Suite.from([].concat(suites)).run(sort, predicate);
}
