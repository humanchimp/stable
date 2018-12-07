import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import babel from "rollup-plugin-babel";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

export default {
  input: "stable-test.js",
  output: {
    format: "iife",
    file: "static/test.js",
    name: "test"
  },
  plugins: [
    babel({
      plugins: [
        ["@babel/plugin-syntax-async-generators"],
        ["@babel/plugin-proposal-async-generator-functions"],
        ["@babel/plugin-proposal-optional-catch-binding"]
      ],
      sourceMaps: true
    }),
    nodeResolve({
      extensions: [".ts", ".tsx", ".js", ".jsx"]
    }),
    commonjs(),
    serve({
      contentBase: "static",
      historyApiFallback: "/index.html"
    }),
    livereload("static")
  ]
};
