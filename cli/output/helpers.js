const { inspect } = require("util");

exports.transformForFormat = function transformForFormat(format) {
  switch (format) {
    case "inspect":
      return it => inspect(it, { depth: 10, colors: true });
    case "json":
    case "jsonlines":
      return it => JSON.stringify(it);
    case "tap":
      return tap;
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
    case "tap": {
      const { ok, skipped, completed } = report;

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
      }
`;
    }
  }
};

let count = 0;

function tap({ ok, description, reason, skipped }) {
  return `${ok ? "" : "not "}ok ${++count} ${description}${
    !ok ? formatReason(reason) : ""
  }${skipped ? " # SKIP" : ""}`;
}

function formatReason(reason) {
  return reason
    ? `

${reason.stack
        .split("\n")
        .map(line => `    ${line}`)
        .join("\n")}
`
    : "";
}
