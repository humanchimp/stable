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

  // The queue is for holding each asynchronous step which are dynamically
  // created by the DSL
  const queue = [];

  // We suffix an outerlude to support the quirky feature of permitting suites
  // to be exported from inside the DSL using ES module syntax.
  const wrapped = `
${code};
return typeof bundle === 'undefined' ? {} : bundle;`;

  // We evaluate the test code inside a function. We inject dependencies into
  // it and pull exports out of it. As it runs, calls to the DSL contained
  // within it are mapped to calls to the builder API such that by the time
  // we are ready to return from this function, we will have built up the
  // entire test suite.
  const bundle = Function(...blocks, ...keys(helpers), wrapped)(
    // Spreaded twice: once to spread the set as an array, again to spread the
    // array as parameters.
    ...[...blocks].map(
      block =>
        // Stacking blocks (variants of `describe`) require us to keep track of
        // which suite the calls inside the DSL should bind to.
        stacking.has(block)
          ? (...rest) => {
              const closure = rest.pop();

              suite[block](...rest, (s, ...r) => {
                // We are capturing the suite, `s`, inside the closure scope!
                queue.push(async () => {
                  let p = suite;

                  // And then right before we actually call the closure we set
                  // the mutable suite binding to the correct suite so that
                  // inside the closure, the calls to the DSL are binding to
                  // the correct suite—the inner one this time.
                  suite = s;
                  await closure(...r);

                  // Then we restore the suite to what it was before, which
                  // ends up having a similar effect to popping a stack. :mindblown:
                  suite = p;
                });
              });
            }
          : // Luckily for us, this path is a simpler scheduling mechanism for
            // the leaf nodes in our graph, lovingly knowns as specs and hooks.
            (...rest) => {
              suite[block](...rest);
            },
    ),
    // The rest of the arguments are helpers supplied by plugins. They could be
    // anything, but we aren't concerned with what they do.
    ...values(helpers),
  );

  // TODO: write a test for the albeit weird feature of exporting suites.
  suite.suites.push(...values(bundle));

  // We simply wait for each item in the queue to complete. Thanks to the
  // iterator protocol, this code is straightforward and handles the growing
  // and shrinking queue gracefully. :mindblown:
  for (const next of queue) {
    await next();
  }
  return suite;
}
