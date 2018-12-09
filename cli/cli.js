const { from } = require("most");
const { fromAsyncIterable } = require("most-async-iterable");
const glob = require("glob");
const { rollup } = require("rollup");
const { ioc } = require("../lib/ioc.js");
const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const babel = require("rollup-plugin-babel");

glob(`test/**-test.js`, (err, files) => {
  if (err != null) {
    console.error(err);
    process.exit(1);
  }

  const reports = from(files)
    .map(entryPoint)
    .await()
    .map(ioc)
    .filter(Boolean)
    .chain(suite => fromAsyncIterable(suite.reports()))
    .map(tap);

  reports.observe(console.log);
});

async function entryPoint(input) {
  const bundle = await rollup({
    input,
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
  return code;
}

let count = 0;

function tap({ ok, description, reason }) {
  return `${ok ? "" : "not "}ok ${++count} - ${description}${formatReason(
    reason,
  )}`;
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