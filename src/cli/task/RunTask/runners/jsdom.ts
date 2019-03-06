import { run as runLocal } from "./local";
import { JSDOM } from "jsdom";
import { Stream } from "most";

export function run(code, options): Stream<any> {
  return runLocal(
    console =>
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
              window.console = console;
              window.stableRun = resolve;
            },
          },
        );
      }),
    options,
  );
}
