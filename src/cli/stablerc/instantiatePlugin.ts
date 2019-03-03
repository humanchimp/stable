import { StablercPlugin } from "../../interfaces";
import { join } from "path";
import { async as glob } from "fast-glob";
import { createFilter } from "rollup-pluginutils";
import { loadModule } from "../loadModule";

export async function instantiatePlugin(
  pluginName,
  baseConfig,
): Promise<StablercPlugin> {
  const { [pluginName]: thunk } = await loadModule(
    join(__dirname, "plugins", pluginName, "index.js"),
  );
  const files =
    baseConfig && baseConfig.include != null
      ? (await glob(baseConfig.include, { cwd: __dirname })).filter(
          baseConfig.exclude != null
            ? createFilter("**", baseConfig.exclude)
            : Boolean,
        )
      : [];
  const config = { ...baseConfig, files };
  const plugin = await thunk(config);

  return {
    config,
    plugin,
    rollupPlugins:
      (plugin.provides &&
        plugin.provides.plugins &&
        plugin.provides.plugins()) ||
      [],
  };
}
