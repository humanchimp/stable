import fixtures from "fixture";

import { partition } from "./partition";

export function getFixtures() {
  const files = Object.keys(fixtures).sort((a, b) =>
    a.localeCompare(b),
  );
  const [reports, suites] = partition(files, file =>
    file.endsWith(".json"),
  );

  return suites.map((suite, index) => ({
    fixture: suite.replace(/\.js$/, ""),
    code: fixtures[suite],
    data: JSON.parse(fixtures[reports[index]]),
  }));
}
