const { inspect } = require("util");
const { expect } = require("chai");

export function objectContaining() {
  return {
    helpers: {
      objectContaining: pattern => ({
        exec(sample) {
          for (const [key, value] of Object.entries(pattern)) {
            try {
              // Piggyback off chai for now...
              expect(sample[key]).to.eql(value);
            } catch (_) {
              return false;
            }
          }
          return true;
        },
        toString: () => inspect(pattern),
      }),
    },
  };
}
