export function mungePlugins(plugins) {
  return [...plugins.entries()].map(([, { plugin }]) => plugin);
}
