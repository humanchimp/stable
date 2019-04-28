import { isAbsolute } from "path";
import ts from "@wessberg/rollup-plugin-ts";
import resolve from "rollup-plugin-node-resolve";
import typescript from "typescript";

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
    ts({
      typescript,
      transpiler: 'babel'
    }),
    resolve({
      extensions: [".js", ".ts"],
      only: [],
    }),
  ],
};
