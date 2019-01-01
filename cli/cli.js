#!/usr/bin/env node
const commands = new Set(["run", "bundle", "eval"]);

// <cli flags>
const {
  c: configFile = "stable.config.js",
  f: filter,
  g: grep,
  r: runner = "eval",
  o: outputFormat = "inspect",
  s: readStdin,
  q: quiet,
  ordered,
  sort: algorithm = ordered ? "ordered" : "shuffle",
  help: helpMenuRequested = false,
  rollup: rollupConfigPath = "rollup.config.js",
  seed,
  partitions,
  partition,
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

run                 run the test suite remotely.
                      [unimplemented]
                      [future default]
eval                run the test suite in the main process.
                      [current default]
bundle              bundle the test suite modules.
                      [unimplemented]

Options:

-c, --config        the path of the config file relative to the working
                    directory.
                      [string]
                      [default: stable.config.js]
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
--rollup            path to the rollup config for your project
                      [string]
                      [default: rollup.config.js]
-q, --quiet         don't send an exit code on failure.
-h, --help          print this message.
`);
  process.exit(0);
}

const glob = require("fast-glob");
const { shuffle, Selection } = require("../lib/stable.js");
const { loadConfigFile } = require("./loadConfigFile");
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
  const config = await loadConfigFile(configFile);
  const { plugins: rollupPlugins } = await loadConfigFile(rollupConfigPath);
  const files =
    explicitFiles.length > 0
      ? explicitFiles
      : await glob(config.glob || "**-test.js");

  await cmd({
    config,
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
  });
}

function implForCommand(cmd) {
  switch (cmd) {
    case "run":
      const { runCommand } = require("./commands/run");

      return runCommand;
    case "bundle": {
      const { bundleCommand } = require("./commands/bundle");

      return bundleCommand;
    }
    case "eval":
    default: {
      const { evalCommand } = require("./commands/eval");

      return evalCommand;
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
