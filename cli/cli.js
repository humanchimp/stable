#!/usr/bin/env node
const commands = new Set(["run", "bundle", "config"]);

// <cli flags>
const {
  f: filter,
  g: grep,
  r: runner = "eval",
  o: outputFormat = "inspect",
  s: readStdin,
  q: quiet,
  v: verbose,
  ordered,
  sort: algorithm = ordered ? "ordered" : "shuffle",
  help: helpMenuRequested = false,
  rollup: rollupConfigPath = "rollup.config.js",
  seed,
  partitions,
  partition,
  port = 10001,
  "hide-skips": hideSkips = "focus",
  coverage = process.env.NYC_CWD != null,
  _: [, , ...positionalParams],
} = require("minimist")(process.argv, {
  alias: {
    c: "config",
    f: "filter",
    g: "grep",
    r: "runner",
    o: "format",
    h: "help",
    s: "stdin",
    q: "quiet",
    v: "verbose",
    p: "port",
  },
});

let command, explicitFiles;

if (positionalParams.length >= 1 && commands.has(positionalParams[0])) {
  [command, ...explicitFiles] = positionalParams;
} else {
  [explicitFiles = []] = [positionalParams];
}

const format = [].concat(outputFormat).pop();

if (partitions != null && partition == null) {
  throw new Error(
    "Currently unsupported: You must pass `partition` if you wish to use `partitions`.",
  );
}
if (partition != null && partitions == null) {
  throw new Error(
    "Invalid options: you must pass `partitions` if you wish to use `partition`.",
  );
}
// </cli flags>
if (helpMenuRequested) {
  console.log(help`
Usage: 🐎 stable [command] [glob]

run                 run the test suite using a runner. [default]

bundle              bundle the test suite modules.

config              perform the algorithm to generate the config
                    relative to the given path, else the pwd.

Options:

-s, --stdin         read stdin.
-f, --filter        a substring match to filter by suite description.
                      [string]
-g, --grep          a JavaScript regular expression to use for filtering by
                    suite description.
                      [string]
-r, --runner        the runner to use
                      [string]
                      [default: eval]
                      [in core: eval, vm]
                      [planned: remote, isolate]
-o, --format        the format of the output stream.
                      [string]
                      [default: tap]
                      [in core: tap, json, inspect]
--sort              the sort algorithm used when visiting the specs. By
                    default, specs are shuffled using the Fisher-Yates
                    algorithm. You can defeat this feature by passing
                    --sort=ordered.
                      [string]
                      [default: shuffle]
                      [in core: shuffle, ordered]
--ordered           a convenient shorthand for --sort=ordered
--partitions        the total of partitions to divide the specs by.
                      [number]
--partition         the partition to run and report.
                      [number]
--seed              for seeding the random number generator used by the built-
                    in shuffle algorithm.
                      [string]
--rollup            path to the rollup config for your project.
                      [string]
                      [default: rollup.config.js]
--coverage          format of code coverage report.
                      [string]
                      [in core: html, lcov, json]
--hide-skips        hide skipped specs from the stream.
                      [string or boolean]
                      [default: 'focus']
-p, --port          the port to listen on whenever stable needs an http server.
                      [default: 10001]
-v, --verbose       be chattier.
                      [boolean]
                      [default: false]
-q, --quiet         don't send an exit code on failure.
-h, --help          print this message.
`);
  process.exit(0);
}

const glob = require("fast-glob");
const { shuffle, Selection } = require("../lib/stable.js");
const { loadConfigFile } = require("./loadConfigFile");
const { configObject, configArray } = require("./commands/config");
const seedrandom = require("seedrandom");
const selection = new Selection({
  filter,
  grep,
});
const sort =
  algorithm === "shuffle"
    ? shuffle.rng(seed == null ? Math.random : seedrandom(seed))
    : identity;
let stdinCode = "";

if (readStdin) {
  process.stdin
    .on("data", data => (stdinCode += data))
    .on("end", () => main().catch(console.error))
    .setEncoding("utf-8");
} else {
  main().catch(console.error);
}

async function main() {
  const cmd = implForCommand(command);

  const entry = await configObject(".", { loadPlugins: false });
  const files = [];

  for (const include of explicitFiles.length > 0
    ? explicitFiles
    : entry.include) {
    files.push(...(await glob(include)));
  }

  const configs = await configArray(files);

  // We need to find all the possible combinations of plugins and runners for files we
  // picked up by loading the the .stablercs.

  // Every mismatch of plugins or runners will need its own bundle
  const bundles = new Map /*config, filename*/();

  for (const { filename, config } of configs) {
    if ("runners" in config || "plugins" in config) {
      if (bundles.has(config)) {
        bundles.get(config).push(filename);
      } else {
        bundles.set(config, [filename]);
      }
    }
  }

  const { plugins: rollupPlugins } = await loadConfigFile(rollupConfigPath);

  if (stdinCode) {
    throw new Error("reading from stdin is temporarily not supported");
  }

  await cmd({
    configs,
    bundles,
    files,
    rollupPlugins,
    stdinCode,
    runner,
    format,
    partition,
    partitions,
    sort,
    selection,
    quiet,
    coverage,
    port,
    hideSkips,
    verbose,
  });
}

function implForCommand(cmd) {
  switch (cmd) {
    case "bundle": {
      const { bundleCommand } = require("./commands/bundle");

      return bundleCommand;
    }
    case "config": {
      const { configCommand } = require("./commands/config");

      return configCommand;
    }
    case "run":
    default: {
      const { runCommand } = require("./commands/run");

      return runCommand;
    }
  }
}

function identity(it) {
  return it;
}

function help([help]) {
  const chalk = require("chalk");

  return help
    .replace(/(\[[^\]]+\])/g, (_, type) => chalk.green(type))
    .replace(/(--?[a-z=]+)/g, (_, option) => chalk.blue(option));
}
