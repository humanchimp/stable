export function chai() {
  return {
    filename: __filename,
    helpers: {
      chai: require("chai"),
    },
  };
}
