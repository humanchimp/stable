export function codeForTestBundle(onready, cardinality = 0) {
  const indexes = [...range(cardinality)];

  return `import { dethunk } from "./stable";${
    onready == null
      ? `
import { run } from "./run";
`
      : ""
  }
${indexes
  .map(
    i => `import { plugins as plugins${i} } from "./plugins-${i}";
import { thunk as thunk${i} } from "./bundle-${i}";`,
  )
  .join("\n")}
Promise.all([
  ${indexes.map(i => `dethunk(thunk${i}, plugins${i})`).join(",\n  ")}
])
  .then(suites => suites.reduce((a, b) => a.concat(b)))
  .then(${onready || "run"});
`;
}

function* range(to: number): IterableIterator<number> {
  for (let i = 0; i < to; i++) {
    yield i;
  }
}
