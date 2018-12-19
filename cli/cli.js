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
// </cli flags>
if (helpMenuRequested) {
  console.log(help`
Usage: 🐎 stable [glob]

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
--sort, -s          The sort algorithm used when visiting the specs. By
                    default, specs are shuffled using the Fisher-Yates
                    algorithm. You can defeat this feature by passing
                    --sort=ordered.
                      [string]
                      [default: shuffle]
                      [in core: shuffle, ordered]
--partitions        The total of partitions to divide the specs by.
                      [number]
--partition         The partition to run and report.
                      [number]
--seed              For seeding the random number generator used by the built-
                    in shuffle algorithm.
                      [string]
--help, -h          Print this message.
`);
  return;
}

const { of, from, startWith } = require("most");
const { fromAsyncIterable } = require("most-async-iterable");
const glob = require("fast-glob");
const { inspect } = require("util");
const { rollup } = require("rollup");
const { describe, dsl, shuffle, Selection } = require("../lib/stable.js");
const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const babel = require("rollup-plugin-babel");
const loadConfigFile = require("./loadConfigFile");
const { assign } = Object;
const transform = transformForFormat(format);
const seedrandom = require("seedrandom");
const selection = new Selection({
  filter,
  grep,
});

const sort =
  algorithm === "shuffle"
    ? shuffle.rng(seed == null ? Math.random : seedrandom(seed)) : identity;

main().catch(console.error);

async function main() {
  const config = await loadConfigFile(configFile);
  const helpers = helpersForPlugins(config.plugins);
  const listeners = listenersForPlugins(config.plugins);
  const files =
    explicitFiles.length > 0
      ? explicitFiles
      : await glob(config.glob || "**-test.js");
  const suite = await suitesFromFiles(files, helpers, listeners).reduce(
    (suite, s) => {
      suite.suites.push(s);
      return suite;
    },
    describe(null),
  );
  let allSpecs = [...suite.orderedSpecs()];

  const counts = {
    total: allSpecs.length,
    planned: undefined,
    completed: 0,
    ok: 0,
    skipped: 0,
  };
  const predicate =
    partition != null && partitions != null
      ? selection.partition(counts.total, partition, partitions)
      : selection.predicate;

  counts.planned = allSpecs.filter(predicate).length;

  await startWith(
    plan(counts.planned),
    fromAsyncIterable(suite.reports(sort, predicate))
      .tap(({ ok, skipped }) => {
        counts.completed += 1;
        if (ok) {
          counts.ok += 1;
        }
        if (skipped) {
          counts.skipped += 1;
        }
      })
      .map(transform)
      .continueWith(() => of(summary(counts))),
  ).observe(console.log);
}

function helpersForPlugins(plugins) {
  return plugins.reduce(
    (memo, { helpers }) => assign(memo, helpers),
    Object.create(null),
  );
}

function listenersForPlugins(plugins) {
  return plugins
    .filter(plugin => plugin.on != null)
    .reduce(
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
      return it => inspect(it, { depth: 10, colors: true });
    case "json":
    case "jsonlines":
      return it => JSON.stringify(it);
    case "tap":
      return tap;
  }
  throw new Error(`unsupported format: -f ${format}`);
}

function plan(planned) {
  switch (format) {
    case "inspect":
      return { plan: planned };
    case "json":
    case "jsonlines":
      return JSON.stringify({ plan: planned });
    case "tap":
      return `1..${planned}`;
  }
}

function summary(counts) {
  switch (format) {
    case "inspect":
      return counts;
    case "json":
    case "jsonlines":
      return JSON.stringify(counts);
    case "tap": {
      const { ok, skipped, completed } = counts;

      return `
# ok ${ok}${
        ok !== completed
          ? `
# failed ${completed - ok}`
          : ""
      }${
        skipped !== 0
          ? `
# skipped ${skipped}`
          : ""
      }
`;
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
    .replace(/(--?[\w|=]+)/g, (_, option) => chalk.blue(option));
}
