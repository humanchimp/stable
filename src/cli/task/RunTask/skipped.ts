import { Plan, Report, Summary } from "../../../framework/interfaces";

export function skipped(report: Plan | Report | Summary): boolean {
  return "skipped" in report && !report.skipped;
}
