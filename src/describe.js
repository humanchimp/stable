import { Suite } from './Suite';

export function describe(description, closure, options) {
  const suite = new Suite(description, options);

  if (closure != null) {
    closure(suite);
  }
  return suite;
}
