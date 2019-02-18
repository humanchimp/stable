export function plan(format, { total, planned }) {
  switch (format) {
    case "inspect":
      return { total, planned };
    case "json":
    case "jsonlines":
      return JSON.stringify({ total, planned });
    case "tap":
      return `1..${planned}`;
  }
}
