import { Message } from "../../../types";

export function skipped(report: Message): boolean {
  return "skipped" in report && !report.skipped;
}
