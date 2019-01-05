const { join, dirname, basename, extname, isAbsolute } = require("path");
const { from } = require("most");
const { rollup } = require("rollup");
const babel = require("@babel/core");
const { default: generate } = require("@babel/generator");
const t = require("@babel/types");
const { default: traverse } = require("@babel/traverse");
const { dir } = require("tmp-promise");
const { copy, writeFile, mkdirp } = require("fs-extra");
const sorcery = require("sorcery");

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
    sourcemap: true,
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
  onready,
}) {
  if (stdinCode) {
    throw new Error(
      "reading from stdin is not currently supported by the bundle command",
    );
  }

  const [bundles, pluginBundle, libraryBundle] = await Promise.all([
    bundlesFromFiles({
      files,
      plugins: [...rollupPlugins, thunkify({ files })],
    }),
    bundlePlugins(config.plugins),
    codeForLibrary(rollupPlugins),
  ]);

  const tmp = await dir({ unsafeCleanup: true });

  try {
    await writeFile(join(tmp.path, "plugins.js"), pluginBundle, "utf-8");

    for (const { input, bundle } of bundles) {
      const bundlePath = join(
        tmp.path,
        `${basename(input, extname(input))}.js`,
      );

      await mkdirp(dirname(bundlePath));
      await bundle.write({
        file: bundlePath,
        format: "esm",
        sourcemap: "inline",
      });
    }

    const testBundle = codeForTestBundle(bundles, onready);
    const testBundlePath = join(tmp.path, "index.js");

    await writeFile(testBundlePath, testBundle, "utf-8");

    const libraryPath = join(tmp.path, "stable.js");
    const libraryMapPath = `${libraryPath}.map`;

    await writeFile(libraryPath, libraryBundle.code, "utf-8");
    await writeFile(libraryMapPath, libraryBundle.map, "utf-8");

    await copy(join(__dirname, "../../plugins"), join(tmp.path, "plugins"));

    return await rollup({
      input: testBundlePath,
    });
  } finally {
    await tmp.cleanup();
  }
}

function bundlesFromFiles({ files, plugins, format, sourcemap }) {
  return Promise.all(
    files.map(async input => ({
      input,
      bundle: await rollup({
        input,
        external(id) {
          if (["tslib", "@topl/stable"].includes(id)) {
            return false;
          }
          if (
            (id[0] !== "." && !isAbsolute(id)) ||
            id.slice(-5, id.length) === ".json"
          ) {
            return true;
          }
          return false;
        },
        plugins,
      }),
    })),
  );
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

function codeForTestBundle(bundles, onready = "run") {
  return `
import { dethunk, run } from "./stable";
import { plugins } from "./plugins";
${bundles
    .map(
      (b, i) =>
        `import { thunk as t${i} } from "./${basename(
          b.input,
          extname(b.input),
        )}";`,
    )
    .join("\n")}
Promise.all([${bundles
    .map((_, i) => `dethunk(t${i}, plugins)`)
    .join(",")}]).then(${onready});`;
}

async function codeForLibrary(plugins) {
  const libraryBundle = await rollup({
    input: join(__dirname, "../../src/lib.ts"),
    plugins: plugins,
  });

  return libraryBundle.generate({ format: "esm", sourcemap: true });
}

function thunkify({ files }) {
  return {
    name: "stable-thunkify",
    transform(code, filename) {
      if (!files.some(file => filename.endsWith(`/${file}`))) {
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
