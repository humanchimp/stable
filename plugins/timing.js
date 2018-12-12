export function timing() {
  return {
    on: {
      pending(report) {
        report.begin = Date.now();
      },
      complete(report) {
        report.end = Date.now();
        report.elapsed = report.end - report.begin;
      },
    },
  };
}
