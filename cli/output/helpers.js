const { inspect } = require("util");

exports.transformForFormat = function transformForFormat(format) {
  switch (format) {
    case "inspect":
      return it => inspect(it, { colors: true });
    case "json":
    case "jsonlines":
      return JSON.stringify;
    case "tap":
      return tapTransform();
  }
  throw new Error(`unsupported format: -f ${format}`);
};

exports.plan = function plan(format, { total, planned }) {
  switch (format) {
    case "inspect":
      return { total, planned };
    case "json":
    case "jsonlines":
      return JSON.stringify({ total, planned });
    case "tap":
      return `1..${planned}`;
  }
};

exports.summary = function summary(format, counts) {
  const report = { ...counts, failed: counts.completed - counts.ok };

  switch (format) {
    case "inspect":
      return report;
    case "json":
    case "jsonlines":
      return JSON.stringify(report);
  }
};

function formatReason(reason) {
  return reason && reason.stack
    ? `

${reason.stack
        .split("\n")
        .map(line => `    ${line}`)
        .join("\n")}
`
    : "";
}

function tapTransform() {
  let count = 0;
  return ({
    ok,
    description,
    reason,
    skipped,
    planned,
    completed,
    userAgent,
  }) => {
    if (planned != null) {
      if (completed == null) {
        return `1..${planned}`;
      }
      return `
# ok ${ok}${
        ok !== completed
          ? `
# failed ${completed - ok}`
          : ""
      }${
        skipped !== 0
          ? `
# skipped ${skipped}`
          : ""
      }${
        userAgent != null
          ? `
# user agent: ${userAgent}`
          : ""
      }
`;
    }
    return `${ok ? "" : "not "}ok ${++count} ${description}${
      !ok ? formatReason(reason) : ""
    }${skipped ? " # SKIP" : ""}`;
  };
}
