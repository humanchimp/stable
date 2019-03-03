import { resolve } from "path";
import { rollup, RollupSingleFileBuild } from "rollup";
import { bundlerAliasForRunner } from "../../bundlerAliasForRunner";

export async function codeForRunner(
  runner: string,
  plugins,
): Promise<RollupSingleFileBuild> {
  const alias = bundlerAliasForRunner(runner);
  const entry =
    alias != null ? `./src/runners/${alias}/run.ts` : "./src/framework/run.ts";

  return rollup({
    input: resolve(__dirname, entry),
    plugins: plugins,
  });
}
