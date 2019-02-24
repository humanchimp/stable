import { Suite } from "../../../../framework/interfaces";
import { of } from "most";
import { fromAsyncIterable } from "most-async-iterable";
import { Script } from "vm";
import { skipped } from "../skipped";
import { implForSort } from "../implForSort";
import { Selection } from "../../../../framework/lib";

export function run(code, { sort, filter, grep }) {
  const selection = new Selection({
    filter,
    grep: grep && new RegExp(grep),
  });
  let hideSkips: boolean | string = "focus";

  return of(
    new Promise(resolve => {
      global["__coverage__"] || (global["__coverage__"] = {});

      const script = new Script(code);

      script.runInNewContext({
        console: console,
        stableRun: resolve,
        require,
        process: process,
        exports: {},
        setTimeout: setTimeout,
        __dirname: __dirname,
        __coverage__: global["__coverage__"],
      });
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
