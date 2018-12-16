import { shuffle } from "./shuffle";
import { Hooks } from "./Hooks";
import { Listeners } from "./Listeners";

export class Suite {
  constructor(
    description = required(),
    { parent, skipped = false, focused = false, listeners } = {},
  ) {
    this.description = description;
    this.parent = parent;
    this.skipped = skipped;
    this.focused = focused;
    this.suites = [];
    this.specs = [];
    this.hooks = new Hooks();
    this.listeners = new Listeners(listeners);
    this.focusMode = false;
    this.opened = false;
  }

  get isFocusMode() {
    return this.focusMode;
  }

  set isFocusMode(value) {
    this.focusMode = value;
    if (value) {
      this.suites.forEach(suite => {
        suite.isFocusMode = true;
      });
    }
  }

  get isDeeplyFocused() {
    if (this.specs.some(spec => spec.focused)) {
      return true;
    }
    return this.suites.some(suite => suite.focused || suite.isDeeplyFocused);
  }

  info(info) {
    this.specs.push({
      description: descriptionForInfo(info),
      skipped: true,
    });
    return this;
  }

  beforeAll(hook = required()) {
    this.hooks.beforeAll.push(hook);
    return this;
  }

  afterAll(hook = required()) {
    this.hooks.afterAll.unshift(hook);
    return this;
  }

  beforeEach(hook = required()) {
    this.hooks.beforeEach.push(hook);
    return this;
  }

  afterEach(hook = required()) {
    this.hooks.afterEach.unshift(hook);
    return this;
  }

  it(description = required(), test) {
    this.specs.push({
      description,
      test,
      skipped: test == null || this.skipped,
      focused: this.focused,
    });
    return this;
  }

  fit(description, test = required()) {
    this.isFocusMode = true;
    this.specs.push({
      description,
      test,
      focused: true,
      skipped: this.skipped,
    });
    return this;
  }

  xit(description = required(), test) {
    this.specs.push({
      description,
      test,
      skipped: true,
      focused: this.focused,
    });
    return this;
  }

  defaultOptions(options) {
    return {
      ...options,
      ...(this.skipped && { skipped: true }),
      ...(this.focused && { focused: true }),
    };
  }

  describe(description, closure = required(), options) {
    const suite = new Suite(description, {
      ...this.defaultOptions(options),
      ...(this.listeners && { listeners: this.listeners }),
      parent: this,
    });

    closure(suite);
    this.suites.push(suite);
    return this;
  }

  fdescribe(description, closure) {
    this.describe(description, closure, { focused: true });
    return this;
  }

  xdescribe(description, closure) {
    this.describe(description, closure, { skipped: true });
    return this;
  }

  describeEach(description, table, closure = required(), options) {
    const baseOptions = {
      ...this.defaultOptions(options),
      ...(this.listeners && { listeners: this.listeners }),
    };
    const suite = new Suite(description, {
      ...baseOptions,
      parent: this,
    });

    for (const row of table) {
      suite.describe(
        descriptionForRow(description, row),
        s => closure(s, row),
        {
          ...baseOptions,
        },
      );
    }
    this.suites.push(suite);
    return this;
  }

  fdescribeEach(description, table, closure, options) {
    this.describeEach(description, table, closure, { focused: true });
    return this;
  }

  xdescribeEach(description, table, closure, options) {
    this.describeEach(description, table, closure, { skipped: true });
    return this;
  }

  size() {
    return (
      this.specs.length +
      this.suites.reduce((sum, suite) => sum + suite.size(), 0)
    );
  }

  *orderedSpecs() {
    for (const spec of this.specs) {
      yield { suite: this, spec };
    }
    for (const suite of this.suites) {
      yield* suite.orderedSpecs();
    }
  }

  *parents() {
    let suite = this;

    do {
      yield suite;
    } while ((suite = suite.parent));
  }

  computeHooks() {
    if (this.computedHooks != null) {
      return;
    }
    const suites = [...this.parents()];
    const afterEach = suites.reduce(
      (memo, suite) => memo.concat(suite.hooks.afterEach),
      [],
    );
    const beforeEach = suites
      .reverse()
      .reduce((memo, suite) => memo.concat(suite.hooks.beforeEach), []);

    this.computedHooks = { beforeEach, afterEach };
  }

  async *runHook(hook, description) {
    const reason = await runTest(hook.thunk);

    if (reason != null) {
      yield {
        reason,
        description: `${hook.name}: ${description}`,
        ok: false,
      };
    }
  }

  async *runSpec(spec) {
    this.computeHooks();
    if (!spec.skipped) {
      for (const thunk of this.computedHooks.beforeEach) {
        yield* await this.runHook(
          { name: "beforeEach", thunk },
          spec.description,
        );
      }
    }
    yield await this.reportForSpec(spec);
    if (!spec.skipped) {
      for (const thunk of this.computedHooks.afterEach) {
        yield* await this.runHook(
          { name: "afterEach", thunk },
          spec.description,
        );
      }
    }
  }

  async *open() {
    if (this.opened) {
      return;
    }
    for (const hook of this.hooks.run("beforeAll")) {
      yield* await this.runHook(hook, this.description);
    }
    this.opened = true;
  }

  async *close() {
    if (!this.opened) {
      return;
    }
    for (const hook of this.hooks.run("afterAll")) {
      yield* await this.runHook(hook, this.description);
    }
    this.opened = false;
  }

  async *reports(sort = shuffle) {
    const specs = sort([...this.orderedSpecs()]);
    const counted = countSpecsBySuite(specs);

    for (const { spec, suite } of specs) {
      yield* await suite.open();
      yield* await suite.runSpec(spec);
      yield* await countSpec(counted, suite);
    }
  }

  async reportForSpec({ description, test, focused, skipped }) {
    description = prefixed(this, description);

    if (skipped || (this.isFocusMode && !focused)) {
      return {
        description,
        ok: true,
        skipped: true,
      };
    }
    const report = this.defaultOptions({ description });

    if (focused) {
      report.focused = true;
    }

    this.listeners.pending.forEach(notify => notify(report, skip));

    if (!skipped) {
      const reason = await runTest(test);

      if (reason != null) {
        report.ok = false;
        report.reason = reason;
      } else {
        report.ok = true;
      }
    } else {
      report.skipped = true;
      if (report.ok == null) {
        report.ok = true;
      }
    }

    this.listeners.complete.forEach(notify => notify(report, fail));

    return report;

    function skip() {
      skipped = true;
    }

    function fail(reason) {
      if (report.ok) {
        report.ok = false;
        report.reason = reason;
      }
    }
  }
}

async function runTest(test) {
  try {
    await test();
  } catch (reason) {
    return reason;
  }
}

function prefixed(node, description) {
  const segments = [];

  do {
    segments.unshift(node.description);
  } while ((node = node.parent));
  return [...segments, description].filter(Boolean).join(" ");
}

function descriptionForRow(description, table) {
  return `${description} [table]`;
}

function descriptionForInfo(info) {
  // Do something reasonable in different scenarios...
  try {
    const url = new URL(info);

    if (/https?:/.test(url.protocol)) {
      return `See ${url} for more information`;
    }
  } catch (_) {}
  return info;
}

function required() {
  throw new Error("required");
}

function countSpecsBySuite(specs) {
  return specs.reduce((memo, { suite }) => {
    do {
      inc(memo, suite, 1);
    } while ((suite = suite.parent));
    return memo;
  }, new Map());
}

function inc(map, key, offset) {
  const [initial = 0] = [map.get(key)];
  const next = initial + offset;

  map.set(key, next);
  return next;
}

async function* countSpec(counted, suite) {
  do {
    if (inc(counted, suite, -1) === 0) {
      yield* await suite.close();
    }
  } while ((suite = suite.parent));
}
