import { describe } from "./stable";
import { helpers, stacking } from "./names";
export { run, reports } from "./stable";

export function ioc(code, description = null) {
  const suite = describe(description);
  const stack = [suite];
  const wrapped = `
${code};
return typeof bundle === 'undefined' ? {} : bundle;`;
  const bundle = Function(...helpers, wrapped)(
    ...[...helpers].map(method =>
      stacking.has(method)
        ? (...rest) => {
            const closure = rest.pop();

            peek()[method](...rest, (s, ...r) => {
              stack.push(s);
              closure(...r);
              stack.pop();
            });
          }
        : (...rest) => {
            peek()[method](...rest);
          },
    ),
  );

  suite.suites.push(...Object.values(bundle));

  return suite;

  function peek() {
    return stack[stack.length - 1];
  }
}
