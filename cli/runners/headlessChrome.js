const { run: runRemote } = require("./remote");

exports.run = function run(code, params) {
  return runRemote(code, {
    ...params,
    spawn: url => [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      ["--headless", "--remote-debugging-port=9222", url],
    ],
  });
};
