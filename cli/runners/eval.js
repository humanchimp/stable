const { of } = require("most");

exports.run = function run(code) {
  return of(
    new Promise(done => {
      Function("require", "stableRun", code)(require, done);
    }),
  ).await();
};
