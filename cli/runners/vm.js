const { of } = require("most");
const { Script } = require("vm");

exports.run = function run(code) {
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
  ).await();
};
