import { kebab } from "../../case/kebab";
import { ModuleFormat } from "rollup";

export function formatForRunner(runner): ModuleFormat {
  switch (kebab(runner)) {
    case "remote":
    case "headless-chrome":
    case "headless chrome":
      return "iife";
  }
  return 'cjs';
}
