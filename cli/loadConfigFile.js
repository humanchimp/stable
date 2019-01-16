const path = require("path");
const { rollup } = require("rollup");
const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");

// All the cleverness of the below derives from copying from the rollup source code 🙇

exports.loadConfigFile = loadConfigFile;
exports.loadModule = loadModule;

function loadConfigFile(configPath, commandOptions = {}) {
  const configFile = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  return loadModule(configFile);
}

async function loadModule(input) {
  const bundle = await rollup({
    input,
    external: id => {
      return (
        (id[0] !== "." && !path.isAbsolute(id)) ||
        id.slice(-5, id.length) === ".json"
      );
    },
    plugins: [
      nodeResolve({
        extensions: Object.keys(require.extensions),
      }),
      commonjs(),
    ],
  });
  const { code } = await bundle.generate({ format: "cjs" });

  // temporarily override require
  const defaultLoader = require.extensions[".js"];

  require.extensions[".js"] = (module, filename) => {
    if (filename === input) {
      module._compile(code, filename);
    } else {
      defaultLoader(module, filename);
    }
  };

  delete require.cache[input];

  const configFileContent = await require(input);
  const config =
    typeof configFileContent === "function"
      ? await configFileContent(commandOptions)
      : configFileContent;

  require.extensions[".js"] = defaultLoader;

  return config;
}
