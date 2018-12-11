import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import babel from "rollup-plugin-babel";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

export default {
  input: "examples/streams.js",
  output: {
    format: "iife",
    file: "static/test.js",
    name: "test",
  },
  plugins: [
    babel({
      plugins: [
        ["@babel/plugin-syntax-async-generators"],
        ["@babel/plugin-proposal-async-generator-functions"],
      ],
      sourceMaps: true,
    }),
    nodeResolve({
      extensions: [".js", ".jsx"],
    }),
    commonjs(),
    serve({
      contentBase: "static",
      historyApiFallback: "/index.html",
    }),
    livereload("static"),
  ],
};
