import { JSDOM } from "jsdom";
import { Stream, of } from "most";
import { fromAsyncIterable } from "most-async-iterable";
import { implForSort } from "../implForSort";
import { Selection } from "../../../../framework/lib";
import { skipped } from "../skipped";
import { Suite } from "../../../../interfaces";

export function run(code, { sort, filter, grep }): Stream<any> {
  const selection = new Selection({
    filter,
    grep: grep && new RegExp(grep),
  });
  let hideSkips: boolean | string = "focus";

  return of(
    new Promise(resolve => {
      new JSDOM(
        `<!doctype html>
<html>
  <head>
    <title>stable</title>
  </head>
  <body>
    <!-- TODO: during bootstrapping, I'm hardcoding chai and sinon dependencies -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chai/4.2.0/chai.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/sinon.js/7.2.2/sinon.js"></script>
    <script>${code}</script>
  </body>
</html>
`,
        {
          runScripts: "dangerously",
          resources: "usable",
          beforeParse(window) {
            window.stableRun = resolve;
          },
        },
      );
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
