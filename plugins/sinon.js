const lib = require("sinon");

export function sinon() {
  return {
    helpers: {
      sinon: lib,
    },
  };
}
