const { of } = require("most");
const { fromAsyncIterable } = require("most-async-iterable");

exports.run = function run(code, { sort, predicate, hideSkips }) {
  return of(
    new Promise(resolve => {
      Function("require", "stableRun", code)(require, resolve);
    }),
  )
    .await()
    .chain(suite =>
      fromAsyncIterable(suite.run(sort, predicate)).filter(report => {
        switch (hideSkips) {
          case true:
            return !report.skipped;
          case "focus": {
            return !report.skipped || !suite.isFocusMode;
          }
        }
        return true;
      }),
    );
};
