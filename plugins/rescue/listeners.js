export function complete(_, report) {
  if (!report.ok && report.rescuer != null) {
    try {
      report.rescuer(report.reason);
      report.rescued = true;
    } catch (reason) {
      report.rescued = false;
      report.notRescuedBecause = reason;
    }
  }
  if (report.shouldFail) {
    if (report.ok) {
      report.ok = false;
      report.reason = new Error("Failure was expected, but it passed!");
    } else if (report.rescued) {
      report.ok = true;
    }
  }
}