const lib = require("sinon");

export function sinon() {
  return {
    filename: __filename,
    helpers: {
      sinon: lib,
    },
  };
}
