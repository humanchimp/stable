const prettyMs = require("pretty-ms");

export function timing({ timeout = 1000 } = {}) {
  return {
    on: {
      pending(report) {
        report.startedAt = Date.now();
      },
      complete(report) {
        report.endedAt = Date.now();
        report.elapsed = report.endedAt - report.startedAt;
        report.description += ` ${prettyMs(report.elapsed)}`;
        if (report.elapsed > timeout) {
          report.timeout = true;
          if (report.ok) {
            report.ok = false;
            report.reason = new Error(
              `Timeout exceeded: ${report.elapsed}ms > ${prettyMs(timeout)}`,
            );
          }
        }
      },
    },
  };
}
