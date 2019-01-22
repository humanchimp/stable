import babel from "rollup-plugin-babel";
import nodeResolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript";
import typescript3 from "typescript";

export default {
  input: "src/framework/lib.ts",
  output: {
    format: "cjs",
    file: "lib/stable.js",
    sourcemap: 'inline',
  },
  external: ['chai', 'sinon'],
  plugins: [
    typescript({
      typescript: typescript3,
      target: "es6",
      lib: ["ES2015"],
      inlineSourceMap: true,
      inlineSources: true
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
      sourceMaps: 'inline',
    }),
    nodeResolve({
      extensions: [".js", ".ts"],
    }),
  ],
};
