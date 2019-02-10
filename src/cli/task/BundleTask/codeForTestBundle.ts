export function codeForTestBundle(onready = "run") {
  return `import { dethunk, run } from "./stable";
import { plugins } from "./plugins";
import { thunk } from "./bundle";
dethunk(thunk, plugins).then(${onready});
`;
}
