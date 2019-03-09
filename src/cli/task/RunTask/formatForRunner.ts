import { kebab } from "../../case/kebab";
import { ModuleFormat } from "rollup";

export function formatForRunner(runner: string): ModuleFormat {
  switch (kebab(runner)) {
    case "remote":
    case "chrome":
    case "jsdom":
      return "iife";
  }
  return "cjs";
}
