const { join, dirname } = require("path");
const { exists, readFile, stat } = require("fs-extra");
const { safeLoad, safeDump } = require("js-yaml");
const { highlight } = require("cli-highlight");
const glob = require("fast-glob");
const { loadModule } = require("../loadConfigFile");
const { assign } = Object;

exports.configCommand = async function configCommand(params) {
  const configs = await getConfigs(params, { loadPlugins: false });

  switch (getFormat(params.format)) {
    case "yaml": {
      console.log(
        highlight(safeDump(configs, { skipInvalid: true }), {
          language: "yaml",
        }),
      );
      break;
    }
    case "json": {
      console.log(
        highlight(JSON.stringify(configs, null, 2), { language: "json" }),
      );
      break;
    }
    case "inspect": {
      console.log(configs);
      break;
    }
  }
};

function getFormat(format) {
  switch (format) {
    case "json":
    case "yaml":
      return format;
    case "inspect":
    case "tap":
    default:
      return "inspect";
  }
}

exports.getConfigs = getConfigs;
exports.configObject = configObject;
exports.configArray = configArray;

async function getConfigs({ files }, options = {}) {
  files = [].concat(files);

  if (files.length > 1) {
    return configArray(files, options);
  }
  return configObject(files[0], options);
}

async function configsForFiles(files, { loadPlugins }) {
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
        [...rcs].map(async rc => [
          rc,
          await loadStablercs(stablercs(rc), { loadPlugins }),
        ]),
      ),
    ),
  ];
}

// FIXME: configObject and configArray are garbage names.
async function configArray(files, { loadPlugins } = {}) {
  const [map, configs] = await configsForFiles(files, { loadPlugins });
  const includes = [
    ...new Set(
      [...configs.entries()]
        .reduce((memo, [, { include }]) => memo.concat(include), [])
        .filter(Boolean),
    ),
  ];

  const moarFiles = (await Promise.all(includes.map(glob))).reduce(
    (memo, files) => memo.concat(files),
    [],
  );

  if (moarFiles.length > 0) {
    for (const file of moarFiles) {
      if (!map.has(file)) {
        return configArray([...new Set(files.concat(moarFiles))], {
          loadPlugins,
        });
      }
    }
  }
  return [...map.entries()].map(([filename, rcfile]) => ({
    filename,
    config: configs.get(rcfile),
  }));
}

async function loadStablercs(rcs, { loadPlugins = true }) {
  const configs = [];

  for await (const { filename, yaml } of rcs) {
    configs.unshift({ filename, yaml, config: safeLoad(yaml) });
  }
  const memo = Object.create(null);

  for (const key of ["include", "plugins", "runners", "custom_runners"]) {
    switch (key) {
      case "plugins":
        if (loadPlugins) {
          memo[key] = await instantiatePlugins(
            configs.reduce(pluginsConfigsReducer, new Map()),
          );
          break;
        }
      case "include":
      case "runners":
      case "custom_runners":
        memo[key] = configs
          .reduce((memo, { config }) => memo.concat(config[key]), [])
          .filter(Boolean);
        break;
    }
  }
  return memo;
}

async function instantiatePlugins(map) {
  const instances = new Map();

  // TODO: support external plugins. I have definite plans for this, but I'm not ready to work on it yet.
  for (const [pluginName, config] of map.entries()) {
    const { [pluginName]: thunk } = await loadModule(
      join(__dirname, "../../plugins", pluginName, "index.js"),
    );

    instances.set(pluginName, { config, plugin: await thunk(config) });
  }
  return instances;
}

function pluginsConfigsReducer(memo, { filename, config }) {
  if (config.plugins == null) {
    return memo;
  }
  for (const [pluginName, pluginConfig] of config.plugins) {
    memo.set(
      pluginName,
      (memo[pluginName] || []).concat(
        { ...pluginConfig, stablerc: filename } || [],
      ),
    );
  }
  return memo;
}

async function configObject(filename, { loadPlugins } = {}) {
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

  return loadStablercs(stablercs(dir), { loadPlugins });
}

async function* stablercs(dir) {
  for await (const filename of stablercsFiles(dir)) {
    yield {
      filename,
      yaml: await readFile(filename, "utf-8"),
    };
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
