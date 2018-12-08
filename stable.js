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
  sort = shuffle
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

export async function* tap(suites, sort = shuffle) {
  let count = 0;

  for await (const { ok, description, reason } of reports(suites, sort)) {
    yield `${ok ? "" : "not "}ok ${++count} - ${description}${formatReason(
      reason
    )}`;
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
      test: passes
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
      skipped: this.skipped || test == null,
      focused: this.focused
    });
    return this;
  }

  fit(description, test = required()) {
    this.focusMode = true;
    this.specs.push({ description, test, focused: true });
    return this;
  }

  xit(description = require(), test) {
    this.specs.push({ description, test, skipped: true });
    return this;
  }

  describe(description, closure = required(), options) {
    const suite = new Suite(description, this, options);

    closure(suite);
    this.suites.push(suite);
    return this;
  }

  fdescribe(description, closure) {
    this.describe(description, closure, false, {
      focused: true,
      skipped: this.skipped
    });
    return this;
  }

  xdescribe(description, closure) {
    this.describe(description, closure, true, {
      skipped: true,
      focused: this.focused
    });
    return this;
  }

  describeEach(description, table, closure = required()) {
    const options = {
      focused: this.focused,
      skipped: this.skipped
    };
    const suite = new Suite(description, this, options);

    for (const row of table) {
      suite.describe(
        descriptionForRow(description, row),
        s => closure(s, row),
        options
      );
    }
    this.suites.push(suite);
    return this;
  }

  fdescribeEach() {
    return this;
  }

  xdescribeEach() {
    return this;
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
      }.bind(this)
    );
    yield* await this.hookify(sort([...this.suites]), async function*(suite) {
      yield* await suite.reports();
    });
  }

  async reportForSpec({ description, test, focused, skipped }) {
    description = prefixed(this, description);

    if (skipped || (this.focusMode && !focused)) {
      return {
        description,
        ok: true,
        skipped: true
      };
    }
    const reason = await runTest(test);

    return {
      description,
      ok: !reason,
      ...(reason != null && { reason })
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
          ok: false
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
