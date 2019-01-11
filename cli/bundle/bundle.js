const { isAbsolute } = require("path");
const { rollup } = require("rollup");
const { from } = require("most");

exports.bundle = function bundle({ files, plugins, format, verbose }) {
  return from(files).map(path =>
    entryPoint({ path, plugins, format, verbose }),
  );
};

async function entryPoint({ path, plugins, format = "iife", verbose }) {
  const bundle = await rollup({
    input: path,
    plugins,
    external(id) {
      if (["tslib", "@topl/stable"].includes(id)) {
        return false;
      }
      if (
        (id[0] !== "." && !isAbsolute(id)) ||
        id.slice(-5, id.length) === ".json"
      ) {
        return true;
      }
      return false;
    },
    onwarn({ message }) {
      // Suppressing a very chatty and unimportant warning
      if (
        /The 'this' keyword is equivalent to 'undefined' at the top level of an ES module, and has been rewritten./.test(
          message,
        )
      ) {
        return;
      }
      if (verbose) {
        console.warn(message);
      }
    },
  });

  return {
    ...(await bundle.generate({
      format,
      name: "bundle",
      sourcemap: true,
    })),
    path,
  };
}
