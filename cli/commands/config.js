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
      [...configs.entries()]
        .reduce((memo, [, { include }]) => memo.concat(include), [])
        .filter(Boolean),
    ),
  ];

  const moarFiles = (await Promise.all(includes.map(glob))).reduce(
    (memo, files) => memo.concat(files),
  );

  if (moarFiles.length > 0) {
    for (const file of moarFiles) {
      if (!map.has(file)) {
        return configArray([...new Set(files.concat(moarFiles))]);
      }
    }
  }
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

  return ["include", "plugins", "runners", "custom_runners"].reduce(
    (memo, key) => {
      switch (key) {
        case "plugins":
          memo.plugins = instantiatePlugins(configs.reduce(pluginsConfigsReducer, {}));
        case "include":
        case "runners":
        case "custom_runners":
          memo[key] = configs.reduce((memo, config) => memo.concat(config[key]), []).filter(Boolean);
          return memo;
      }
    },
    Object.create(null),
  );

  // return configs.reduce((memo, config) => assign(memo, config), {});
}

function instantiatePlugins(reduced) {
 console.log(reduced);
}

function pluginsConfigsReducer(memo, config) {
  if (config.plugins == null) {
    return;
  }
  for (const [pluginName, pluginConfig] of config.plugins) {
    memo[pluginName] = (memo[pluginName] || []).concat(pluginConfig || []);
  }
  return memo;
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
