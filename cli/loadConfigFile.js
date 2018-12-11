const { rollup } = require("rollup");
const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");

// All the cleverness of the below derives from copying from the rollup source code 🙇

module.exports = async function loadConfigFile(
  configFile,
  commandOptions = {},
) {
  const bundle = await rollup({
    input: configFile,
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
