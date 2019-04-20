import { isAbsolute } from "path";
import babel from "rollup-plugin-babel";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript";
import typescript3 from "typescript";

export default {
  input: "src/cli/entry.ts",
  output: {
    format: "cjs",
    file: "cli-impl.js",
    sourcemap: "inline",
  },
  external: id =>
    (id[0] !== "." && !isAbsolute(id)) || id.slice(-5, id.length) === ".json",
  plugins: [
    typescript({
      typescript: typescript3,
      target: "es6",
      lib: ["ES2015"],
      inlineSourceMap: true,
      inlineSources: true,
    }),
    babel({
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "current",
            },
          },
        ],
      ],
      plugins: [
        ["@babel/plugin-syntax-async-generators"],
        ["@babel/plugin-proposal-async-generator-functions"],
      ],
      sourceMaps: "inline",
    }),
    nodeResolve({
      extensions: [".js", ".ts"],
      only: [],
    }),
    ...(process.env.CLI
      ? [
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
      : []),
  ],
};
