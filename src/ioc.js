import { describe } from "./stable";
import { helpers, stacking } from "./names";
export { run, reports, tap } from "./stable";

export function ioc(code) {
  const suite = describe(null);
  const stack = [suite];
  const wrapped = `
${code};
return typeof bundle === 'undefined' ? {} : bundle;`;

  const bundle = Function("exports", ...helpers, wrapped)(
    exports,
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
