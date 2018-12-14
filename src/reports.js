import { shuffle } from "./shuffle";

export async function* reports(suites, sort = shuffle) {
  suites = [].concat(suites);

  for (const suite of sort([...suites])) {
    for await (const result of suite.reports(sort)) {
      yield result;
    }
  }
}
