// Note: there is a bug and this path is wrong!
const lib = require("./lib/stable");

export function stable() {
  return {
    filename: __filename,
    helpers: { stable: lib },
  };
}
