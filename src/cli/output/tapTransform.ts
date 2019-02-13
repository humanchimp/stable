import { formatReason } from "./formatReason";

export function tapTransform() {
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
