import { isAbsolute } from "path";
import ts from "@wessberg/rollup-plugin-ts";
import typescript from "typescript";

export default {
  input: "src/cli/entry.ts",
  output: {
    format: "cjs",
    file: "cli-impl.js",
    sourcemap: true,
  },
  external: id =>
    (id[0] !== "." && !isAbsolute(id)) || id.slice(-5, id.length) === ".json",
  plugins: [
    ts({
      typescript,
      transpiler: 'babel'
    }),
  ],
};
