import { Plan, Report, Summary } from "../../../interfaces";

export function skipped(report: Plan | Report | Summary): boolean {
  return "skipped" in report && !report.skipped;
}
