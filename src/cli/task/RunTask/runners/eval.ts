import { Suite } from "../../../../framework/interfaces";
import { of, Stream } from "most";
import { fromAsyncIterable } from "most-async-iterable";
import { skipped } from "../skipped";
import { implForSort } from "../implForSort";
import { Selection } from "../../../../framework/lib";

export function run(code, { sort, filter, grep }): Stream<any> {
  const selection = new Selection({
    filter,
    grep: grep && new RegExp(grep),
  });
  let hideSkips: string | boolean = "focus";

  return of(
    new Promise(resolve => {
      new Function("require", "stableRun", code)(require, resolve);
    }),
  )
    .await()
    .chain((suite: Suite) =>
      fromAsyncIterable(
        suite.run(implForSort(sort), selection.predicate),
      ).filter(report => {
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
