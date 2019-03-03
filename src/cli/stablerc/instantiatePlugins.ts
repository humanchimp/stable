import { StablercPlugin } from "../../interfaces";
import { instantiatePlugin } from "./instantiatePlugin";

export async function instantiatePlugins(
  filename: string,
  map: Map<string, any>,
): Promise<Map<string, StablercPlugin>> {
  const instances = new Map();

  // TODO: support external plugins. I have definite plans for this, but I'm not ready to work on it yet.
  for (const [pluginName, config] of map.entries()) {
    instances.set(pluginName, await instantiatePlugin(pluginName, config));
  }
  return instances;
}
