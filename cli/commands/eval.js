const { of, startWith } = require("most");
const { fromAsyncIterable } = require("most-async-iterable");
const { describe, dsl } = require("../../lib/stable.js");
const { bundle } = require("../bundle/helpers");
const { transformForFormat, plan, summary } = require("../output/helpers");

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
  const listeners = listenersForPlugins(config.plugins);
  const preludes = preludesForPlugins(config.plugins);

  const suite =
    stdinCode !== ""
      ? await dsl({ code: stdinCode, helpers, listeners, preludes })
      : await suitesFromFiles({
          files,
          helpers,
          listeners,
          preludes,
          rollupPlugins,
        }).reduce((suite, s) => {
          suite.suites.push(s);
          return suite;
        }, describe(null));
  let allSpecs = [...suite.orderedJobs()];

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
    plan(format, counts),
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
      .continueWith(() => of(summary(format, counts))),
  ).observe(console.log);

  if (
    (!quiet && counts.ok < counts.completed) ||
    counts.completed < counts.planned
  ) {
    process.exit(1);
  }
};

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

function suitesFromFiles({
  files,
  helpers,
  listeners,
  preludes,
  rollupPlugins,
}) {
  return bundle({ files, plugins: rollupPlugins, format: "iife" })
    .await()
    .map(({ code, path }) =>
      dsl({ code, helpers, description: `${path} |`, listeners, preludes }),
    )
    .await()
    .multicast();
}
