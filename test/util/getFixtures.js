import { partition } from "./partition";

export async function getFixtures(pattern) {
  const files = (await glob(pattern)).sort((a, b) =>
    a.file.localeCompare(b.file),
  );
  const [suites, reports] = partition(files, ({ file }) =>
    file.endsWith(".js"),
  );

  return suites.map((suite, index) => ({
    fixture: suite.file.replace(/\.js$/, ""),
    code: suite.contents,
    data: JSON.parse(reports[index].contents),
  }));
}
