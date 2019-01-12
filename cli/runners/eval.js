const { of } = require("most");

exports.run = function run(code) {
  return of(
    new Promise(resolve => {
      Function("require", "stableRun", code)(require, resolve);
    }),
  ).await();
};
