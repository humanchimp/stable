import { shuffle } from "./shuffle";

export function describe(description, closure) {
  const suite = new Suite(description);

  if (closure != null) {
    closure(suite);
  }
  return suite;
}

export async function run(
  suites,
  generate = reports,
  perform = console.log,
  sort = shuffle,
) {
  for await (const report of generate(suites, sort)) {
    perform(report);
  }
}

export async function* reports(suites, sort = shuffle) {
  suites = [].concat(suites);

  for (const suite of sort([...suites])) {
    for await (const result of suite.reports(sort)) {
      yield result;
    }
  }
}

class Hooks {
  constructor() {
    this.beforeAll = [];
    this.beforeEach = [];
    this.afterEach = [];
    this.afterAll = [];
  }
}

class Suite {
  constructor(description, parent, { skipped = false, focused = false } = {}) {
    this.description = description;
    this.parent = parent;
    this.skipped = skipped;
    this.focused = focused;
    this.hooks = new Hooks();
    this.specs = [];
    this.suites = [];
    this.focusMode = false;
  }

  info(info) {
    this.specs.push({
      description: descriptionForInfo(info),
      skipped: true,
      test: passes,
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
    this.focusMode = true;
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
    const suite = new Suite(description, this, this.defaultOptions(options));

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
    const suite = new Suite(description, this, this.defaultOptions(options));

    for (const row of table) {
      suite.describe(
        descriptionForRow(description, row),
        s => closure(s, row),
        options,
      );
    }
    this.suites.push(suite);
    return this;
  }

  fdescribeEach() {
    this.describeEach(description, table, closure, { focused: true });
    return this;
  }

  xdescribeEach() {
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
    yield* await this.runHooks("beforeAll", this);
    for await (const item of queue) {
      yield* await this.runHooks("beforeEach", item);
      yield* generate(item);
      yield* await this.runHooks("afterEach", item);
    }
    yield* await this.runHooks("afterAll", this);
  }

  async *reports(sort = shuffle) {
    yield* await this.hookify(
      this.specs,
      function*(spec) {
        yield this.reportForSpec(spec);
      }.bind(this),
    );
    yield* await this.hookify(sort([...this.suites]), async function*(suite) {
      yield* await suite.reports(sort);
    });
  }

  async reportForSpec({ description, test, focused, skipped }) {
    description = prefixed(this, description);

    if (skipped || (this.focusMode && !focused)) {
      return {
        description,
        ok: true,
        skipped: true,
      };
    }
    const reason = await runTest(test);

    return {
      description,
      ok: !reason,
      ...(reason != null && { reason }),
    };
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
  {
    const url = new URL(info);

    if (url.hostname || url.pathname) {
      return `See ${url} for more information`;
    }
  }
  return description;
}

function required() {
  throw new Error("required");
}

function passes() {
  return true;
}
