export function summary(format, counts) {
  const report = { ...counts, failed: counts.completed - counts.ok };

  switch (format) {
    case "inspect":
      return report;
    case "json":
    case "jsonlines":
      return JSON.stringify(report);
  }
}
