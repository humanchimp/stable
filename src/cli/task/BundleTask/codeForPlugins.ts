import { join } from "path";
import { importNameForPackageName } from "./importNameForPackageName";
import { StablercPlugin } from "../../../interfaces";

export function codeForPlugins(plugins: StablercPlugin[]): string {
  const listenerModules = plugins
    .map(({ plugin }) => plugin)
    .filter(plugin => plugin.provides && plugin.provides.listeners)
    .map(plugin => ({
      exportName: importNameForPackageName(plugin.package.name),
      path: join(plugin.package.name, plugin.provides.listeners),
      config: plugin.config,
    }));

  const listenerBundle = `import { plugins as convert } from './stable';
${listenerModules
  .map(
    ({ exportName, path }) =>
      `import * as ${exportName}_raw from "${forNow(path)}";`,
  )
  .join("\n")}
${listenerModules
  .map(({ exportName, config }) => {
    const importName = `${exportName}_raw`;
    const jsonConfig = JSON.stringify(config);

    // Shoehorn-in the config... This is pretty gross
    return `const ${exportName} = {
  pending: ${importName}.pending && ${importName}.pending.bind(null, ${jsonConfig}),
  complete: ${importName}.complete && ${importName}.complete.bind(null, ${jsonConfig})
};`;
  })
  .join("\n")}
const plugins = convert({${listenerModules.map(m => m.exportName).join(",")}});
export { plugins };
`;

  return listenerBundle;
}

function forNow(path) {
  return `./plugins/${path.slice("@topl/stable-plugin-".length)}`;
}
