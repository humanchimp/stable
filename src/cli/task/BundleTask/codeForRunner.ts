import { resolve } from "path";
import { rollup } from "rollup";
import { bundlerAliasForRunner } from "../../bundlerAliasForRunner";

export async function codeForRunner(runner: string, plugins) {
  const alias = bundlerAliasForRunner(runner);
  const entry =
    alias != null ? `./src/runners/${alias}/run.ts` : "./src/framework/run.ts";
  const runnerBundle = await rollup({
    input: resolve(__dirname, entry),
    plugins: plugins,
  });

  return runnerBundle.generate({ format: "esm", sourcemap: true });
}
