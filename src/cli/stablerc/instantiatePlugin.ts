import { StablercPlugin } from "../../interfaces";
import { async as glob } from "fast-glob";
import { createFilter } from "rollup-pluginutils";
import { loadModule } from "../loadModule";

export async function instantiatePlugin(
  pluginName,
  baseConfig,
): Promise<StablercPlugin> {
  const { [pluginName]: thunk } = await loadModule(
    require.resolve(`@topl/stable-plugin-${pluginName}`),
  );
  const files =
    baseConfig && baseConfig.include != null
      ? (await glob(baseConfig.include, { cwd: __dirname })).filter(
          createFilter("**", baseConfig.exclude),
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
