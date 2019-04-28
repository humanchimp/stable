import config from "./rollup.config";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve"

export default {
  ...config,
  input: 'src/cli/entry.ts',
  output: {
    file: 'cli-impl.js',
    format: 'esm',
    sourcemap: 'inline',
  },
  external: [],
  plugins: [
    ...config.plugins,
    resolve({
      extensions: [".js", ".ts"],
      only: [],
    }),
    commonjs({
      include: "node_modules/**",
      namedExports: {
        // left-hand side can be an absolute path, a path
        // relative to the current directory, or the name
        // of a module in node_modules
        "fs-extra": ["readFile"],
        "js-yaml": ["safeLoad", "safeDump"],
      },
    }),
  ]
};
