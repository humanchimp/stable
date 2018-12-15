import { describe } from "./describe";
import { blocks, stacking } from "./names";

const { keys, values } = Object;

export async function dsl({
  code,
  helpers = Object.create(null),
  description = null,
  listeners = {},
}) {
  // Mutable `suite` binding... this code gets pretty hairy
  let suite = describe(description, null, { listeners });

  const queue = [];
  const wrapped = `
${code};
return typeof bundle === 'undefined' ? {} : bundle;`;
  const bundle = Function(...blocks, ...keys(helpers), wrapped)(
    ...[...blocks].map(
      block =>
        stacking.has(block)
          ? (...rest) => {
              const closure = rest.pop();

              suite[block](...rest, (s, ...r) => {
                queue.push(async () => {
                  let previousSuite = suite;

                  suite = s;
                  await closure(...r);
                  suite = previousSuite;
                });
              });
            }
          : (...rest) => {
              suite[block](...rest);
            },
    ),
    ...values(helpers),
  );

  // TODO: write a test for the albeit weird feature of exporting suites.
  suite.suites.push(...values(bundle));

  for (const next of queue) {
    await next();
  }
  return suite;
}
