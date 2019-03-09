import { run as runLocal } from "./local";
import { Script } from "vm";

export function run(code, options) {
  return runLocal(
    console =>
      new Promise(resolve => {
        global["__coverage__"] || (global["__coverage__"] = {});

        const script = new Script(code);

        script.runInNewContext({
          console,
          stableRun: resolve,
          require,
          process: process,
          exports: {},
          setTimeout: setTimeout,
          __dirname: __dirname,
          __coverage__: global["__coverage__"],
        });
      }),
    options,
  );
}
