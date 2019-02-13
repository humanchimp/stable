import { join } from "path";
import { rollup } from "rollup";

export async function codeForLibrary(plugins) {
  const libraryBundle = await rollup({
    input: join(__dirname, "./src/framework/lib.ts"),
    plugins: plugins,
  });

  return libraryBundle.generate({ format: "esm", sourcemap: true });
}
