import { TestRun } from "../../../interfaces";
import { kebab } from "../../case/kebab";
import { run as evalRunner } from "./runners/eval";
import { run as vmRunner } from "./runners/vm";
import { run as chromeRunner } from "./runners/chrome";
import { run as jsdomRunner } from "./runners/jsdom";

export function implForRunner(runner): TestRun {
  switch (kebab(runner)) {
    case "eval":
      return evalRunner;
    case "vm":
    case "isolate": // This is cheating for now
      return vmRunner;
    case "chrome":
      return chromeRunner;
    case "jsdom":
      return jsdomRunner;
  }
  throw new Error(`unknown runner type: "${runner}"`);
}
