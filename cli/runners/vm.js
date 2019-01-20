const { of } = require("most");
const { fromAsyncIterable } = require("most-async-iterable");
const { Script } = require("vm");

exports.run = function run(code, { sort, predicate, hideSkips }) {
  return of(
    new Promise(resolve => {
      global.__coverage__ || (global.__coverage__ = {});

      const script = new Script(code);

      script.runInNewContext({
        console: console,
        stableRun: resolve,
        require,
        process: process,
        exports: {},
        setTimeout: setTimeout,
        __coverage__: __coverage__,
      });
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
