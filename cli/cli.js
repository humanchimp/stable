#!/usr/bin/env node

// <cli flags>
const {
  c: configFile = "stable.config.js",
  f: filter,
  g: grep,
  o: outputFormat = "inspect",
  s: algorithm = "shuffle",
  help: helpMenuRequested = false,
  seed,
  partitions,
  partition,
  _: [, , ...explicitFiles],
} = require("minimist")(process.argv, {
  alias: {
    c: "config",
    f: "filter",
    g: "grep",
    o: "format",
    h: "help",
    s: "sort",
  },
});

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
if (algorithm === "shuffle" && partition != null && seed == null) {
  throw new Error(
    "Invalid options: A seed must be passed to each partition if you wish to use `shuffle` and `partition` together.",
  );
}
// </cli flags>
if (helpMenuRequested) {
  console.log(`
Usage: stable [glob]

Options:

--config, -c        The path of the config file relative to the working
                    directory.
                      [string]
                      [default: stable.config.js]
--filter, -f        A substring match to filter by suite description.
                      [string]
--grep, -g          A JavaScript regular expression to use for filtering by
                    suite description.
                      [string]
--format, -o        The format of the output stream.
                      [string]
                      [default: tap]
                      [in core: tap, json, inspect]
--sort, -s          The sort algorithm used when visiting the suites. By
                    default, suites are shuffled using the Fisher-Yates
                    algorithm. You can defeat this feature by passing
                    --sort=ordered.
                      [string]
                      [default: shuffle]
                      [in core: shuffle, ordered]
--partitions        The total of partitions to divide the specs by.
                      [number]
--partition         The partition to run. Using this feature implies
                    --sort=ordered, unless you also pass a seed.
                      [number]
--seed              For seeding the random number generator used by the built-
                    in shuffle algorithm. It is mandatory when combining
                    --sort=shuffle and --partition. You must pass the same
                    seed to each partition.
                      [string]
--help, -h          Print this message.
`);
  return;
}

const { from, startWith } = require("most");
const { fromAsyncIterable } = require("most-async-iterable");
const glob = require("fast-glob");
const { rollup } = require("rollup");
const { dsl } = require("../lib/stable.js");
const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const babel = require("rollup-plugin-babel");
const loadConfigFile = require("./loadConfigFile");
const { assign } = Object;
const transform = transformForFormat(format);

main().catch(console.error);

async function main() {
  const config = await loadConfigFile(configFile);
  const helpers = helpersForPlugins(config.plugins);
  const listeners = listenersForPlugins(config.plugins);
  const files =
    explicitFiles.length > 0
      ? explicitFiles
      : await glob(config.glob || "**-test.js");
  const suites = suitesFromFiles(files, helpers, listeners);
  let i = 0;

  await startWith(
    await planForSuites(suites),
    suites
      .chain(suite => fromAsyncIterable(suite.reports()))
      .map(transform)
      .tap(() => i++),
  ).observe(console.log);
}

function helpersForPlugins(plugins) {
  return plugins.reduce(
    (memo, { helpers }) => assign(memo, helpers),
    Object.create(null),
  );
}

function listenersForPlugins(plugins) {
  return plugins.filter(plugin => plugin.on != null).reduce(
    (memo, { on: { pending = [], complete = [] } }) => ({
      pending: memo.pending.concat(pending),
      complete: memo.complete.concat(complete),
    }),
    { pending: [], complete: [] },
  );
}

function suitesFromFiles(files, helpers, listeners) {
  return from(files)
    .map(entryPoint)
    .await()
    .map(({ code, path }) =>
      dsl({ code, helpers, description: `${path} |`, listeners }),
    )
    .await()
    .multicast();
}

async function entryPoint(path) {
  const bundle = await rollup({
    input: path,
    plugins: [
      babel({
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                node: "current",
              },
            },
          ],
        ],
        plugins: [
          ["@babel/plugin-syntax-async-generators"],
          ["@babel/plugin-proposal-async-generator-functions"],
        ],
        sourceMaps: true,
      }),
      nodeResolve({
        extensions: [".js"],
      }),
      commonjs(),
    ],
  });

  const { code } = await bundle.generate({
    format: "iife",
    name: "bundle",
    sourcemap: "inline",
  });
  return { code, path };
}

let count = 0;

function tap({ ok, description, reason, skipped }) {
  return `${ok ? "" : "not "}ok ${++count} ${description}${
    !ok ? formatReason(reason) : ""
  }${skipped ? " # SKIP" : ""}`;
}

function formatReason(reason) {
  return reason
    ? `

${reason.stack
        .split("\n")
        .map(line => `    ${line}`)
        .join("\n")}
`
    : "";
}

function transformForFormat(format) {
  switch (format) {
    case "inspect":
      return identity;
    case "json":
    case "jsonlines":
      return it => JSON.stringify(it);
    case "tap":
      return tap;
  }
  throw new Error(`unsupported format: -f ${format}`);
}

async function planForSuites(suites) {
  const count = await suites.reduce((sum, suite) => sum + suite.size(), 0);

  switch (format) {
    case "inspect":
      return { plan: count };
    case "json":
    case "jsonlines":
      return JSON.stringify({ plan: count });
    case "tap":
      return `1..${count}`;
  }
}

function identity(it) {
  return it;
}
