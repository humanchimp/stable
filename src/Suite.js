import { shuffle } from "./shuffle";
import { Hooks } from "./Hooks";
import { Listeners } from "./Listeners";

export class Suite {
  constructor(
    description,
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
    return this.suites.some(suite =>
      suite.focused || suite.isDeeplyFocused);
  }

  info(info) {
    this.specs.push({
      description: descriptionForInfo(info),
      skipped: true,
    });
    return this;
  }

  beforeAll(hook) {
    this.hooks.beforeAll.push(hook);
    return this;
  }

  afterAll(hook) {
    this.hooks.afterAll.push(hook);
    return this;
  }

  beforeEach(hook) {
    this.hooks.beforeEach.push(hook);
    return this;
  }

  afterEach(hook) {
    this.hooks.afterEach.push(hook);
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

  xit(description = require(), test) {
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

  async *hookify(queue, generate) {
    for (const item of queue) {
      const { skipped } = item;

      if (!skipped) {
        yield* await this.runHooks("beforeEach", item);
      }
      yield* await generate(item);
      if (!skipped) {
        yield* await this.runHooks("afterEach", item);
      }
    }
  }

  async *reports(sort = shuffle) {
    yield* await this.runHooks("beforeAll", this);
    yield* await this.hookify(
      this.specs,
      async function*(spec) {
        yield this.reportForSpec(spec);
      }.bind(this),
    );
    yield* await this.hookify(sort([...this.suites]), async function*(suite) {
      yield* await suite.reports(sort);
    });
    yield* await this.runHooks("afterAll", this);
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

  async *runHooks(hookName, item) {
    const { description } = item;

    for (const hook of this.hooks[hookName]) {
      const reason = await runTest(hook);

      if (reason) {
        yield {
          reason,
          description: `${hookName}: ${description}`,
          ok: false,
        };
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
