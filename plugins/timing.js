export function timing() {
  return {
    on: {
      beforeEach(report) {
        report.begin = Date.now();
      },
      afterEach(report) {
        report.end = Date.now();
        report.elapsed = report.end - report.begin;
      },
    },
  };
}
