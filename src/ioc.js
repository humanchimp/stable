import { describe } from "./describe";
import { blocks, stacking } from "./names";

const { keys, values } = Object;

export function ioc({
  code,
  helpers = Object.create(null),
  description = null,
  listeners = {},
}) {
  const suite = describe(description, null, { listeners });
  const stack = [suite];
  const wrapped = `
${code};
return typeof bundle === 'undefined' ? {} : bundle;`;
  const bundle = Function(...blocks, ...keys(helpers), wrapped)(
    ...[...blocks].map(
      block =>
        stacking.has(block)
          ? (...rest) => {
              const closure = rest.pop();

              peek()[block](...rest, (s, ...r) => {
                stack.push(s);
                closure(...r);
                stack.pop();
              });
            }
          : (...rest) => {
              peek()[block](...rest);
            },
    ),
    ...values(helpers),
  );

  suite.suites.push(...values(bundle));

  return suite;

  function peek() {
    return stack[stack.length - 1];
  }
}
