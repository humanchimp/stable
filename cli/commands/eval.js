const { join } = require("path");
const { fromAsyncIterable } = require("most-async-iterable");
const { describe, dsl } = require("../../lib/stable.js");
const { bundle } = require("../bundle/bundle");
const { transformForFormat } = require("../output/helpers");
const { loadConfigFile } = require("../loadConfigFile");

const { assign } = Object;

exports.evalCommand = async function evalCommand({
  config,
  files,
  rollupPlugins,
  stdinCode,
  partition,
  partitions,
  sort,
  selection,
  format,
  quiet,
}) {
  const transform = transformForFormat(format);
  const helpers = helpersForPlugins(config.plugins);
  const listeners = await listenersForPlugins(config.plugins);

  const suite =
    stdinCode !== ""
      ? await dsl({ code: stdinCode, helpers, listeners })
      : await suitesFromFiles({
          files,
          helpers,
          listeners,
          rollupPlugins,
        }).reduce((memo, suite) => {
          memo.suites.push(suite);
          return memo;
        }, describe(null));

  const predicate =
    partition != null && partitions != null
      ? selection.partition(counts.total, partition, partitions)
      : selection.predicate;

  let failed = false;

  await fromAsyncIterable(suite.run(sort, predicate))
    .tap(report => {
      if (report.failed > 0) {
        failed = true;
      }
    })
    .map(transform)
    .observe(console.log);

  if (!quiet && failed) {
    process.exit(1); // 👋
  }
};

function helpersForPlugins(plugins) {
  return plugins.reduce(
    (memo, { helpers }) => assign(memo, helpers),
    Object.create(null),
  );
}

async function listenersForPlugins(plugins) {
  const oldStyle = plugins
    .filter(plugin => plugin.on != null)
    .map(plugin => plugin.on);
  const newStyle = await Promise.all(
    plugins
      .filter(plugin => plugin.provides && plugin.provides.listeners)
      .map(async plugin => {
        const { pending, complete } = await loadConfigFile(
          join(forNow(plugin.package.name), plugin.provides.listeners),
        );

        return {
          pending: pending && pending.bind(null, plugin.config),
          complete: complete && complete.bind(null, plugin.config),
        };
      }),
  );

  return [...oldStyle, ...newStyle].reduce(
    (memo, { pending = [], complete = [] }) => ({
      pending: memo.pending.concat(pending),
      complete: memo.complete.concat(complete),
    }),
    { pending: [], complete: [] },
  );
}

function suitesFromFiles({ files, helpers, listeners, rollupPlugins }) {
  return bundle({ files, plugins: rollupPlugins, format: "iife" })
    .await()
    .map(({ code, path }) =>
      dsl({ code, helpers, description: `${path} |`, listeners }),
    )
    .await()
    .multicast();
}

function forNow(path) {
  return `./plugins/${path.slice("@topl/stable-plugin-".length)}`;
}
