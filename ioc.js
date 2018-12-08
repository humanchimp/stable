import { describe } from "./stable";
import { helpers, stacking } from "./names";

export function ioc(code) {
  const suite = describe(null);
  const stack = [suite];

  Function(...helpers, code)(
    ...[...helpers].map(f => {
      return (...rest) => {
        if (!stacking.has(f)) {
          peek()[f](...rest);
          return;
        }
        const closure = rest.pop();

        peek()[f](...rest, (suite, ...r) => {
          stack.push(suite);
          closure(...r);
          stack.pop();
        });
        return;
      };
    })
  );

  return suite;

  function peek() {
    return stack[stack.length - 1];
  }
}
