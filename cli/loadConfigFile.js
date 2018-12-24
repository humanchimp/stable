const path = require("path");
const { rollup } = require("rollup");
const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const json = require("rollup-plugin-json");

// All the cleverness of the below derives from copying from the rollup source code 🙇

module.exports = async function loadConfigFile(
  configPath,
  commandOptions = {},
) {
  const configFile = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);
  const bundle = await rollup({
    input: configFile,
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
    if (filename === configFile) {
      module._compile(code, filename);
    } else {
      defaultLoader(module, filename);
    }
  };

  delete require.cache[configFile];

  const configFileContent = await require(configFile);
  const config =
    typeof configFileContent === "function"
      ? await configFileContent(commandOptions)
      : configFileContent;

  require.extensions[".js"] = defaultLoader;

  return config;
};
