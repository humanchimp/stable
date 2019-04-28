import { ISuite, Sorter } from "../../../interfaces";
import { Message } from "../../../types";
import { Selection } from "../../../framework/lib";

export async function* runSuite(
  suite: ISuite,
  selection: Selection,
  sorter: Sorter,
  failFast: boolean,
): AsyncIterableIterator<Message> {
  for await (const report of suite.run(sorter, selection.predicate)) {
    yield report;
    if ("ok" in report && report.ok === false && failFast) {
      return;
    }
  }
}
