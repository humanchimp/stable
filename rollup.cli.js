import config from "./rollup.config";
import commonjs from "rollup-plugin-commonjs";

export default {
  ...config,
  input: 'src/framework/lib.ts',
  output: {
    file: 'dist/framework.js',
    format: 'esm',
    sourcemap: 'inline',
  },
  external: [],
  plugins: [
    ...config.plugins,
    commonjs({
      include: "node_modules/**",
      namedExports: {
        // left-hand side can be an absolute path, a path
        // relative to the current directory, or the name
        // of a module in node_modules
        "fs-extra": ["readFile"],
        "js-yaml": ["safeLoad", "safeDump"],
      },
    })
  ]
};
