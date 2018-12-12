const { from, startWith } = require("most");
const { fromAsyncIterable } = require("most-async-iterable");
const glob = require("fast-glob");
const argv = require("minimist")(process.argv);
const { rollup } = require("rollup");
const { ioc } = require("../lib/stable.js");
const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const babel = require("rollup-plugin-babel");
const loadConfigFile = require("./loadConfigFile");

const { assign } = Object;

const configFile = argv.c || "stable.config.js";

main();

async function main() {
  const config = await loadConfigFile(configFile);
  const helpers = helpersForPlugins(config.plugins);
  const listeners = listenersForPlugins(config.plugins);
  const files = await glob(config.glob || "**-test.js");
  const suites = suitesFromFiles(files, helpers, listeners);

  await startWith(
    `1..${await suites.reduce((sum, suite) => sum + suite.size(), 0)}`, // Plan
    suites.chain(suite => fromAsyncIterable(suite.reports())).map(tap), // Stream
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
      ioc({ code, helpers, description: `${path} |`, listeners }),
    )
    .filter(Boolean)
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
