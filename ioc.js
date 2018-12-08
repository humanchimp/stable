import { describe } from "./stable";
import { helpers, stacking } from "./names";

export function ioc(code) {
  const suite = describe(null);
  const stack = [suite];

  Function(...helpers, code)(
    ...[...helpers].map(
      method =>
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
            }
    )
  );

  return suite;

  function peek() {
    return stack[stack.length - 1];
  }
}
