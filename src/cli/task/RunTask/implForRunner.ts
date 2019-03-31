import { TestRun } from "../../../interfaces";
import { kebab } from "../../case/kebab";
import { run as evalRunner } from "./runners/eval";
import { run as chromeRunner } from "./runners/chrome";
import { run as jsdomRunner } from "./runners/jsdom";

export function implForRunner(runner): TestRun {
  switch (kebab(runner)) {
    case "eval":
    case "vm": // This is cheating for now
    case "isolate": // More cheating
      return evalRunner;
    case "chrome":
      return chromeRunner;
    case "jsdom":
      return jsdomRunner;
  }
  throw new Error(`unknown runner type: "${runner}"`);
}
