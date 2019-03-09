import { rollup, RollupOutput } from "rollup";
import { isAbsolute } from "path";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

interface _CompileHaver {
  _compile(code: string, filename: string): void;
}

export async function loadModule(input) {
  const bundle = await rollup({
    input,
    external: id => {
      return (
        (id[0] !== "." && !isAbsolute(id)) ||
        id.slice(-5, id.length) === ".json"
      );
    },
    plugins: [
      nodeResolve({
        extensions: Object.keys(require.extensions),
      }),
      commonjs(),
    ],
  });
  const {
    output: [{ code }],
  }: RollupOutput = await bundle.generate({ format: "cjs" });

  // temporarily override require 💅
  const defaultLoader = require.extensions[".js"];

  require.extensions[".js"] = (module, filename) => {
    if (filename === input) {
      ((module as any) as _CompileHaver)._compile(code, filename);
    } else {
      defaultLoader(module, filename);
    }
  };

  delete require.cache[input];

  const loadedModule = await require(input);

  require.extensions[".js"] = defaultLoader;

  return loadedModule;
}
