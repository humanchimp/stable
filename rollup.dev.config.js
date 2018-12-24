import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import babel from "rollup-plugin-babel";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript";
import typescript3 from "typescript";
import json from "rollup-plugin-json";

export default {
  input: "src/lib.ts",
  output: {
    format: "iife",
    file: "static/lib.js",
    name: "stable",
  },
  plugins: [
    typescript({
      typescript: typescript3
    }),
    babel({
      plugins: [
        ["@babel/plugin-syntax-async-generators"],
        ["@babel/plugin-proposal-async-generator-functions"],
      ],
      sourceMaps: true,
    }),
    nodeResolve({
      extensions: [".js", ".ts", ".json"],
    }),
    commonjs(),
    serve({
      contentBase: "static",
      historyApiFallback: "/index.html",
    }),
    livereload("static"),
    json(),
  ],
};
