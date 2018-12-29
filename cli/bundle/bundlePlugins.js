const { join } = require("path");

exports.bundlePlugins = async function bundlePlugins(plugins) {
  const listenerModules = plugins
    .filter(plugin => plugin.provides && plugin.provides.listeners)
    .map(plugin => ({
      exportName: importNameForPackageName(plugin.package.name),
      path: join(plugin.package.name, plugin.provides.listeners),
      config: plugin.config,
    }));

  const listenerBundle = `
import { plugins as convert } from '@topl/stable';
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
      return `
const ${exportName} = {
  pending: ${importName}.pending && ${importName}.pending.bind(null, ${jsonConfig}),
  complete: ${importName}.complete && ${importName}.complete.bind(null, ${jsonConfig})
};`;
    })
    .join("\n")}
const plugins = convert({${listenerModules.map(m => m.exportName).join(",")}})
export { plugins };
`;

  return listenerBundle;
};

function importNameForPackageName(packageName) {
  const conventionalSlug = "stable-plugin-";

  if (!packageName.includes(conventionalSlug)) {
    throw new Error("plugin doesn't support the convention");
  }
  return packageName.slice(
    packageName.indexOf(conventionalSlug) + conventionalSlug.length,
  );
}

function forNow(path) {
  return `./plugins/${path.slice("@topl/stable-plugin-".length)}`;
}
