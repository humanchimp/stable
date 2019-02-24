export function codeForTestBundle(onready) {
  return `import { dethunk } from "./stable";
${onready == null ? `import { run } from "./run"` : ""};
import { plugins } from "./plugins";
import { thunk } from "./bundle";
dethunk(thunk, plugins).then(${onready || "run"});
`;
}
