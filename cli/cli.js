#!/usr/bin/env node

// <cli flags>
const {
  c: configFile = "stable.config.js",
  f: filter,
  g: grep,
  o: outputFormat = "inspect",
  s: readStdin,
  q: quiet,
  ordered,
  sort: algorithm = ordered ? "ordered" : "shuffle",
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
    s: "stdin",
    q: "quiet",
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
-q, --quiet         don't send an exit code on failure.
-h, --help          print this message.
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
  const config = await loadConfigFile(configFile);
  const helpers = helpersForPlugins(config.plugins);
  const listeners = listenersForPlugins(config.plugins);
  const preludes = preludesForPlugins(config.plugins);
  const files =
    explicitFiles.length > 0
      ? explicitFiles
      : await glob(config.glob || "**-test.js");
  const suite =
    stdinCode !== ""
      ? await dsl({ code: stdinCode, helpers, listeners, preludes })
      : await suitesFromFiles({ files, helpers, listeners, preludes }).reduce(
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
    plan(counts),
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

  if (
    (!quiet && counts.ok < counts.completed) ||
    counts.completed < counts.planned
  ) {
    process.exit(1);
  }
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

function preludesForPlugins(plugins) {
  return plugins.map(plugin => plugin.prelude).filter(Boolean);
}

function suitesFromFiles({ files, helpers, listeners, preludes }) {
  return from(files)
    .map(entryPoint)
    .await()
    .map(({ code, path }) =>
      dsl({ code, helpers, description: `${path} |`, listeners, preludes }),
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

function plan({ total, planned }) {
  switch (format) {
    case "inspect":
      return { total, planned };
    case "json":
    case "jsonlines":
      return JSON.stringify({ total, planned });
    case "tap":
      return `1..${planned}`;
  }
}

function summary(counts) {
  const report = { ...counts, failed: counts.completed - counts.ok };

  switch (format) {
    case "inspect":
      return report;
    case "json":
    case "jsonlines":
      return JSON.stringify(report);
    case "tap": {
      const { ok, skipped, completed } = report;

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
    .replace(/(--?[a-z=]+)/g, (_, option) => chalk.blue(option));
}
