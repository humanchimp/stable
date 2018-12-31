const { of } = require("most");
const { Script } = require("vm");

exports.run = function run(code, sort, predicate) {
  return of(
    new Promise(done => {
      global.__coverage__ || (global.__coverage__ = {});

      const script = new Script(code);

      script.runInNewContext({
        console: console,
        stableRun: done,
        require,
        process: process,
        exports: {},
        setTimeout: setTimeout,
        __coverage__: __coverage__,
      });
    }),
  ).await();
};
