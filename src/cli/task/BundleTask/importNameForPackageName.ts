export function importNameForPackageName(packageName) {
  const conventionalSlug = "stable-plugin-";

  if (!packageName.includes(conventionalSlug)) {
    throw new Error("plugin doesn't support the convention");
  }
  return packageName.slice(
    packageName.indexOf(conventionalSlug) + conventionalSlug.length,
  );
}
