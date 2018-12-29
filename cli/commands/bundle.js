const fs = require("fs");
const { join } = require("path");
const virtual = require("rollup-plugin-virtual");
const { rollup } = require("rollup");
const { bundle } = require("../bundle/bundle");
const { bundlePlugins } = require("../bundle/bundlePlugins");
const babel = require("@babel/core");
const { default: generate } = require("@babel/generator");

const names = [
  "describe",
  "xdescribe",
  "fdescribe",
  "describeEach",
  "xdescribeEach",
  "fdescribeEach",
  "it",
  "xit",
  "fit",
  "beforeAll",
  "afterAll",
  "beforeEach",
  "afterEach",
  "info",
];
const apiParams = names.join(",");

exports.bundleCommand = bundleCommand;
exports.generateBundle = generateBundle;

async function bundleCommand(params) {
  const { outFile = `static/bundle.js`, bundleFormat = "iife" } = params;
  const bundle = await generateBundle(params);

  await bundle.write({
    file: outFile,
    format: bundleFormat,
  });
}

async function generateBundle({
  config,
  files,
  rollupPlugins,
  stdinCode,
}) {
  if (stdinCode) {
    throw new Error(
      "reading from stdin is not currently supported by the bundle command",
    );
  }

  const pluginsModule = await bundlePlugins(config.plugins);
  const bundles = await bundlesFromFiles({
    files,
    rollupPlugins: [
      ...rollupPlugins,
      {
        name: "stable-thunkify",
        transform(code, filename) {
          if (!files.some(file => filename.endsWith(`/${file}`))) {
            return code;
          }
          const suiteModule = babel.parse(code);
          const { program } = suiteModule;
          const [imports, rest] = partition(program.body, node =>
            ["ImportDeclaration"].includes(node.type),
          );
          const { program: exportProgram } = babel.parse(
            `export function thunk(${apiParams}) {}`,
          );
          const { body: thunk } = exportProgram.body[0].declaration;

          thunk.body = rest;
          program.body = [...imports, exportProgram];

          return generate(program);
        },
      },
    ],
    pluginsModule,
    format: "esm",
  })
    .await()
    .reduce((bundle, b) => bundle.concat(b), []);
  const libraryBundle = await rollup({
    input: join(__dirname, "../../src/lib.ts"),
    plugins: rollupPlugins,
  });
  const { code: libraryCode } = await libraryBundle.generate({ format: "esm" });
  const testBundleCode = `
import { dethunk, run } from "@topl/stable";
import { plugins } from "pluginbundle";
${bundles
    .map((b, i) => `import { thunk as t${i} } from "${b.path}";`)
    .join("\n")}
Promise.all([${bundles
    .map((_, i) => `dethunk(t${i}, plugins)`)
    .join(",")}]).then(run);`;
  const ioc = await rollup({
    input: "testbundle",
    onwarn(message) {
      // Suppressing a very chatty and unimportant warning
      if (/is not exported by/.test(message)) {
        return;
      }
    },
    plugins: [
      virtual({
        testbundle: testBundleCode,
      }),
      ...bundles.map(({ path, code }) =>
        virtual({
          [path]: code,
        }),
      ),
      virtual({
        pluginbundle: pluginsModule,
      }),
      virtual({
        "@topl/stable": libraryCode,
      }),
    ],
  });

  return ioc;
}

function bundlesFromFiles({ files, rollupPlugins, format }) {
  return bundle({ files, plugins: rollupPlugins, format });
}

function partition(collection, predicate) {
  return collection.reduce(
    (memo, candidate) => {
      memo[1 - predicate(candidate)].push(candidate);
      return memo;
    },
    [[], []],
  );
}
