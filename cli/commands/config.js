const { join, dirname } = require("path");
const { exists, readFile, stat } = require("fs-extra");
const { safeLoad, safeDump } = require("js-yaml");
const { highlight } = require("cli-highlight");
const glob = require("fast-glob");
const { assign } = Object;

exports.configCommand = async function configCommand(params) {
  console.log(
    highlight(safeDump(await getConfigs(params)), { language: "yaml" }),
  );
};

async function getConfigs({ files }) {
  if (files.length > 1) {
    return configArray(files);
  }
  return configObject(files[0]);
}

async function configsForFiles(files) {
  const rcs = new Set();
  const map = new Map();

  for (const filename of files) {
    for await (const stablercFile of stablercsFiles(
      join(process.cwd(), filename),
    )) {
      if (!map.has(filename)) {
        map.set(filename, stablercFile);
      }
      rcs.add(stablercFile);
    }
  }

  return [
    map,
    new Map(
      await Promise.all(
        [...rcs].map(async rc => [rc, await loadStablercs(stablercs(rc))]),
      ),
    ),
  ];
}

async function configArray(files) {
  const [map, configs] = await configsForFiles(files);
  const includes = [
    ...new Set(
      [...configs.entries()].map(([, { include }]) => include).filter(Boolean),
    ),
  ];

  const moarFiles = (await Promise.all(includes.map(glob))).reduce((memo, files) => memo.concat(files));

  console.log(moarFiles);

  return [...map.entries()].map(([filename, rcfile]) => ({
    filename,
    config: configs.get(rcfile),
  }));
}

async function loadStablercs(rcs) {
  const configs = [];

  for await (const stablerc of rcs) {
    configs.unshift(safeLoad(stablerc));
  }

  return configs.reduce((memo, config) => assign(memo, config), {});
}

async function configObject(filename) {
  const file = join(process.cwd(), filename);
  let dir;
  {
    const { isDirectory } = await stat(file);

    if (isDirectory) {
      dir = file;
    } else {
      dir = dirname(file);
    }
  }

  return loadStablercs(stablercs(dir));
}

async function* stablercs(dir) {
  for await (const stablerc of stablercsFiles(dir)) {
    yield readFile(stablerc, "utf-8");
  }
}

async function* stablercsFiles(dir) {
  do {
    const stablercFile = join(dir, ".stablerc");

    if (await exists(stablercFile)) {
      yield stablercFile;
    }
  } while ((dir = dir && dir !== "/" && dirname(dir)));
}
