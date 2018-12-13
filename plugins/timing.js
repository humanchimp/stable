const prettyMs = require("pretty-ms");

export function timing({ timeout = 1000 } = {}) {
  let pendingReport;

  return {
    on: {
      pending(report) {
        report.startedAt = Date.now();
        pendingReport = report;
      },

      complete(report, fail) {
        pendingReport = undefined;
        report.endedAt = Date.now();
        report.elapsed = report.endedAt - report.startedAt;
        report.description += ` ${prettyMs(report.elapsed)}`;

        const specTimeout = report.timeout || timeout;

        if (report.elapsed > specTimeout) {
          report.timedOut = true;
          fail(
            new Error(
              `Timeout exceeded: ${report.elapsed}ms > ${prettyMs(
                specTimeout,
              )}`,
            ),
          );
        }
      },
    },

    helpers: {
      timeout(ms) {
        if (pendingReport == null) {
          throw new Error("Call timeout from inside a spec");
        }
        pendingReport.timeout = ms;
      },
    },
  };
}
