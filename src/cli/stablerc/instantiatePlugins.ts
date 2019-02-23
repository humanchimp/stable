import { join } from "path";
import { async as glob } from "fast-glob";
import { createFilter } from "rollup-pluginutils";
import { loadModule } from "../loadModule";
import { StablercPlugin } from "../interfaces";

export async function instantiatePlugins(
  filename: string,
  map: Map<string, any>,
): Promise<Map<string, StablercPlugin>> {
  const instances = new Map();

  // TODO: support external plugins. I have definite plans for this, but I'm not ready to work on it yet.
  for (const [pluginName, baseConfig] of map.entries()) {
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

    instances.set(pluginName, {
      config,
      plugin: await thunk(config, filename),
    });
  }
  return instances;
}
