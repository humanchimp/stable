const path = require("path");
const { from, startWith } = require("most");
const { fromAsyncIterable } = require("most-async-iterable");
const glob = require("fast-glob");
const { rollup } = require("rollup");
const { ioc } = require("../lib/stable.js");
const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const babel = require("rollup-plugin-babel");
const loadConfigFile = require("./loadConfigFile");

const { assign } = Object;

main();

async function main() {
  const config = await loadConfigFile(
    path.join(process.cwd(), "stable.config.js"),
  );
  const helpers = config.plugins.reduce(
    (memo, { helpers }) => assign(memo, helpers),
    Object.create(null),
  );
  const listeners = config.plugins
    .filter(plugin => plugin.on != null)
    .reduce(
      (memo, { on: { pending = [], complete = [] } }) => ({
        pending: memo.pending.concat(pending),
        complete: memo.complete.concat(complete),
      }),
      { pending: [], complete: [] },
    );
  const files = await glob(config.glob || "**-test.js");
  const suites = from(files)
    .map(entryPoint)
    .await()
    .map(({ code, path }) =>
      ioc({ code, helpers, description: `${path} |`, listeners }),
    )
    .filter(Boolean)
    .multicast();

  await startWith(
    `1..${await suites.reduce((sum, suite) => sum + suite.size(), 0)}`, // Plan
    suites.chain(suite => fromAsyncIterable(suite.reports())).map(tap), // Stream
  ).observe(console.log);
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
  return `${ok ? "" : "not "}ok ${++count} ${description}${formatReason(
    reason,
  )}${skipped ? " # SKIP" : ""}`;
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
