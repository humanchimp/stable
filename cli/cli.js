const path = require("path");
const { expect } = require("chai");
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

main().then(console.log, console.error);

async function main() {
  const config = await loadConfigFile(
    path.join(process.cwd(), "stable.config.js"),
  );
  const helpers = config.plugins.reduce((memo, { helpers }) => assign(memo, helpers), {});
  const files = await glob(config.glob || "**-test.js");
  const suites = from(files)
    .map(entryPoint)
    .await()
    .map(({ code, path }) => ioc(code, `${path} |`, helpers))
    .filter(Boolean)
    .multicast();

  startWith(
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
          ["@babel/plugin-proposal-optional-catch-binding"],
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
