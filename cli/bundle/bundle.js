const { rollup } = require("rollup");
const { from } = require("most");

exports.bundle = function bundle({ files, plugins, format, pluginsModule }) {
  return from(files).map(path =>
    entryPoint({ path, plugins, format, pluginsModule }),
  );
};

async function entryPoint({ path, plugins, pluginsModule, format = "iife" }) {
  const bundle = await rollup({
    input: path,
    plugins,
    external: ["stable", "chai", "sinon"],
    onwarn(message) {
      // Suppressing a very chatty and unimportant warning
      if (
        /The 'this' keyword is equivalent to 'undefined' at the top level of an ES module, and has been rewritten./.test(
          message,
        )
      ) {
        return;
      }
    },
  });

  const { code } = await bundle.generate({
    format,
    name: "bundle",
    sourcemap: "inline",
  });

  return { code, path };
}
