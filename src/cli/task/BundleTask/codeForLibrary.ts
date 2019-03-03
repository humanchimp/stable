import { join } from "path";
import { rollup, RollupSingleFileBuild } from "rollup";

export async function codeForLibrary(plugins): Promise<RollupSingleFileBuild> {
  return rollup({
    input: join(__dirname, "./src/framework/lib.ts"),
    plugins: plugins,
  });
}
