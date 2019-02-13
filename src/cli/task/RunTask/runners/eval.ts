import { Suite } from "../../../../framework/interfaces";
import { of, Stream } from "most";
import { fromAsyncIterable } from "most-async-iterable";
import { skipped } from "../skipped";

export function run(code, { sort, predicate, hideSkips }): Stream<any> {
  return of(
    new Promise(resolve => {
      new Function("require", "stableRun", code)(require, resolve);
    }),
  )
    .await()
    .chain((suite: Suite) =>
      fromAsyncIterable(suite.run(sort, predicate)).filter(report => {
        switch (hideSkips) {
          case true:
            return !skipped(report);
          case "focus": {
            return !skipped(report) || !suite.isFocusMode;
          }
        }
        return true;
      }),
    );
}
