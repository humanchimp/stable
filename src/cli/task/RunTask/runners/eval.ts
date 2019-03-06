import { Stream } from "most";
import { run as runLocal } from "./local";

export function run(code, options): Stream<any> {
  return runLocal(
    console =>
      new Promise(resolve => {
        new Function("require", "stableRun", "console", code)(
          require,
          resolve,
          console,
        );
      }),
    options,
  );
}
