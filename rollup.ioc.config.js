import babel from "rollup-plugin-babel";
import nodeResolve from "rollup-plugin-node-resolve";

export default {
  input: "src/ioc.js",
  output: {
    format: "cjs",
    file: "lib/ioc.js",
  },
  plugins: [
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
        ["@babel/plugin-proposal-optional-catch-binding"],
      ],
      sourceMaps: true,
    }),
    nodeResolve({
      extensions: [".js"],
    }),
  ],
};
