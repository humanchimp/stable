import { TestRun } from "../../interfaces";
import { kebab } from "../../case/kebab";
import { run as evalRunner } from "./runners/eval";
import { run as vmRunner } from "./runners/vm";
import { run as remoteRunner } from "./runners/remote";
import { run as headlessChromeRunner } from "./runners/headlessChrome";

export function implForRunner(runner): TestRun {
  switch (kebab(runner)) {
    case "eval":
      return evalRunner;
    case "vm":
    case "isolate": // This is cheating for now
      return vmRunner;
    case "remote":
      // This will fail because of no `spawnParams` 🤷
      return remoteRunner;
    case "headless-chrome":
    case "headless chrome":
      return headlessChromeRunner;
  }
  throw new Error(`unknown runner type: "${runner}"`);
}
