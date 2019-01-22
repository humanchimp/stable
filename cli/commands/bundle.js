const { join, dirname, basename, isAbsolute } = require("path");
const { rollup } = require("rollup");
const babel = require("@babel/core");
const { default: generate } = require("@babel/generator");
const t = require("@babel/types");
const { default: traverse } = require("@babel/traverse");
const { dir } = require("tmp-promise");
const { copy, writeFile, readFile, mkdirp } = require("fs-extra");
const sorcery = require("sorcery");
const multiEntry = require("rollup-plugin-multi-entry");
const babelPluginIstanbul = require("babel-plugin-istanbul");

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

exports.bundleCommand = bundleCommand;
exports.generateBundle = generateBundle;

async function bundleCommand(params) {
  const { outFile = `static/bundle.js`, bundleFormat = "iife" } = params;
  const bundle = await generateBundle(params);

  await bundle.write({
    file: outFile,
    format: bundleFormat,
    sourcemap: "inline",
    globals: {
      sinon: "sinon",
      chai: "chai",
    },
    sourcemapPathTransform(path) {
      return join(__dirname, "../..", basename(path));
    },
  });

  const chain = await sorcery.load(outFile);

  await chain.write();
}

async function generateBundle({
  config,
  files,
  rollupPlugins,
  stdinCode,
  coverage: shouldInstrument,
  onready,
  verbose,
}) {
  if (stdinCode) {
    throw new Error(
      "reading from stdin is not currently supported by the bundle command",
    );
  }

  const plugins = mungePlugins(config.plugins);

  const pluginRollupPlugins = plugins
    .map(plugin => plugin.provides && plugin.provides.plugins)
    .filter(Boolean)
    .reduce((memo, thunk) => memo.concat(thunk()), []);

  const [bundle, pluginBundle, libraryBundle] = await Promise.all([
    bundleFromFiles({
      files,
      shouldInstrument,
      verbose,
      plugins: [...pluginRollupPlugins, ...rollupPlugins],
    }),
    bundlePlugins(plugins),
    codeForLibrary(rollupPlugins),
  ]);

  const tmp = await dir({ unsafeCleanup: true });

  try {
    await writeFile(join(tmp.path, "plugins.js"), pluginBundle, "utf-8");

    const bundlePath = join(tmp.path, `bundle.js`);

    await mkdirp(dirname(bundlePath));
    await bundle.write({
      file: bundlePath,
      format: "esm",
      sourcemap: "inline",
    });

    const chain = await sorcery.load(bundlePath);

    await chain.write({ inline: true });

    const testBundle = codeForTestBundle(onready);
    const testBundlePath = join(tmp.path, "index.js");

    await writeFile(testBundlePath, testBundle, "utf-8");

    const libraryPath = join(tmp.path, "stable.js");
    const libraryMapPath = `${libraryPath}.map`;

    await writeFile(libraryPath, libraryBundle.code, "utf-8");
    await writeFile(libraryMapPath, libraryBundle.map, "utf-8");

    await copy(join(__dirname, "../../plugins"), join(tmp.path, "plugins"));

    return await rollup({
      input: testBundlePath,
      onwarn: verbose ? console.warn : () => {},
      plugins: [thunkify({ files: [bundlePath] })],
    });
  } finally {
    await tmp.cleanup();
  }
}

function bundleFromFiles({ files, plugins, shouldInstrument, verbose }) {
  return rollup({
    input: files,
    onwarn: verbose ? console.warn : () => {},
    external(id) {
      if (["tslib"].includes(id)) {
        return false;
      }
      if (
        (id[0] !== "." && !isAbsolute(id)) ||
        id.slice(-5, id.length) === ".json"
      ) {
        const isExternal = plugins.every(
          plugin => plugin.resolveId == null || plugin.resolveId(id) == null,
        );

        return isExternal;
      }
      return false;
    },
    plugins: [
      ...plugins,
      ...(shouldInstrument
        ? [
            {
              name: "stable-instrument",
              async transform(code, id) {
                if (files.includes(id) || id[0] === "\x00") {
                  return;
                }

                let currentCode = await readFile(id, "utf-8");
                let currentMap = null;
                const memo = [];

                for (const { transform } of plugins.filter(
                  plugin => plugin.transform != null,
                )) {
                  const result = await transform(currentCode, id);

                  if (result == null) {
                    break;
                  }

                  ({ map: currentMap, code: currentCode } = result);
                }
                return babel.transform(code, {
                  filename: id,
                  sourceMaps: "inline",
                  plugins: [
                    [
                      babelPluginIstanbul,
                      {
                        include: ["src/**/*"],
                        inputSourceMap: currentMap,
                      },
                    ],
                  ],
                });
              },
            },
          ]
        : []),
      multiEntry(),
    ],
  });
}

function partition(collection, predicate) {
  return collection.reduce(
    (memo, candidate) => {
      memo[predicate(candidate) ? 0 : 1].push(candidate);
      return memo;
    },
    [[], []],
  );
}

function codeForTestBundle(onready = "run") {
  return `
import { dethunk, run } from "./stable";
import { plugins } from "./plugins";
import { thunk } from "./bundle"
dethunk(thunk, plugins).then(${onready})`;
}

async function codeForLibrary(plugins) {
  const libraryBundle = await rollup({
    input: join(__dirname, "../../src/framework/lib.ts"),
    plugins: plugins,
  });

  return libraryBundle.generate({ format: "esm", sourcemap: true });
}

function thunkify({ files }) {
  return {
    name: "stable-thunkify",
    transform(code, filename) {
      if (!files.some(file => filename === file)) {
        return;
      }
      const ast = babel.parse(code, { filename });

      traverse(ast, {
        Program(path) {
          const [imports, rest] = partition(path.node.body, node =>
            ["ImportDeclaration"].includes(node.type),
          );
          if (rest.length > 1 || !t.isExportNamedDeclaration(rest[0])) {
            path.replaceWith(
              t.program([
                ...imports,
                t.exportNamedDeclaration(
                  t.functionDeclaration(
                    t.identifier("thunk"),
                    names.map(name => t.identifier(name)),
                    t.blockStatement(rest),
                  ),
                  [],
                ),
              ]),
            );
          }
        },
      });

      return generate(
        ast,
        { sourceMaps: true, sourceFileName: filename },
        code,
      );
    },
  };
}

function bundlePlugins(plugins) {
  const listenerModules = plugins
    .filter(plugin => plugin.provides && plugin.provides.listeners)
    .map(plugin => ({
      exportName: importNameForPackageName(plugin.package.name),
      path: join(plugin.package.name, plugin.provides.listeners),
      config: plugin.config,
    }));

  const listenerBundle = `
import { plugins as convert } from './stable';
${listenerModules
    .map(
      ({ exportName, path }) =>
        `import * as ${exportName}_raw from "${forNow(path)}";`,
    )
    .join("\n")}
${listenerModules
    .map(({ exportName, config }) => {
      const importName = `${exportName}_raw`;
      const jsonConfig = JSON.stringify(config);

      // Shoehorn-in the config... This is pretty gross
      return `
const ${exportName} = {
  pending: ${importName}.pending && ${importName}.pending.bind(null, ${jsonConfig}),
  complete: ${importName}.complete && ${importName}.complete.bind(null, ${jsonConfig})
};`;
    })
    .join("\n")}
const plugins = convert({${listenerModules.map(m => m.exportName).join(",")}})
export { plugins };
`;

  return listenerBundle;
}

function importNameForPackageName(packageName) {
  const conventionalSlug = "stable-plugin-";

  if (!packageName.includes(conventionalSlug)) {
    throw new Error("plugin doesn't support the convention");
  }
  return packageName.slice(
    packageName.indexOf(conventionalSlug) + conventionalSlug.length,
  );
}

function forNow(path) {
  return `./plugins/${path.slice("@topl/stable-plugin-".length)}`;
}

function mungePlugins(plugins) {
  return [...plugins.entries()].map(([, { plugin }]) => plugin);
}
