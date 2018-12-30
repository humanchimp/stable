const { Script } = require("vm");
const { generateBundle } = require("./bundle");

exports.runCommand = async function runCommand(params) {
  const bundle = await generateBundle({ ...params });
  const { code } = await bundle.generate({ format: "cjs" });
  const script = new Script(code);

  script.runInNewContext({
    console: console,
    require,
    exports: {},
    setTimeout: setTimeout,
  });
};
