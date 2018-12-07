export function describe(description, closure) {
  const suite = new Suite(description);

  if (closure != null) {
    closure(suite);
  }
  return suite;
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
  constructor(description, parent, skipped = false) {
    this.description = description;
    this.parent = parent;
    this.skipped = skipped;
    this.hooks = new Hooks();
    this.specs = [];
    this.suites = [];
    this.focused = false;
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

  fit(description, test) {
    this.focused = true;
    this.specs.push({ description, test, focused: true });
  }

  xit(description, test) {
    this.specs.push({ description, test, skipped: true });
  }

  it(description, test) {
    this.specs.push({ description, test, skipped: this.skipped });
    return this;
  }

  describe(description, closure, skipped = false) {
    {
      const { length } = arguments;

      if (length !== 2 && length !== 3) {
        throw new TypeError(`Expected 2 or 3 arguments. Got ${length}`);
      }
    }
    const suite = new Suite(description, this, skipped);

    closure(suite);
    this.suites.push(suite);
    return this;
  }

  xdescribe(description) {
    this.describe(description, closure, true);
    return this;
  }

  async *hookify(queue, callback) {
    yield* await this.runHooks("beforeAll", this);
    for await (const item of queue) {
      yield* await this.runHooks("beforeEach", item);
      yield* callback(item);
      yield* await this.runHooks("afterEach", item);
    }
    yield* await this.runHooks("afterAll", this);
  }

  async *run() {
    yield* await this.hookify(
      this.specs,
      function*(spec) {
        yield this.runSpec(spec);
      }.bind(this)
    );
    yield* await this.hookify(this.suites, async function*(suite) {
      yield* await suite.run();
    });
  }

  async *tap() {
    for await (const { ok, description, reason } of this.run()) {
      yield `${ok ? "" : "not "}ok ${description}${formatReason(reason)}`;
    }
  }

  async runSpec({ description, test, focused, skipped }) {
    description = prefixed(this, description);

    if (skipped || (this.focused && !focused)) {
      return {
        description,
        ok: true,
        skipped: true
      };
    }
    const reason = await runTest(test);

    return {
      description,
      reason,
      ok: !reason
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
  return [...segments, description].join(" ");
}

function formatReason(reason) {
  if (!reason) {
    return "";
  }
  return `
${reason.stack
    .split("\n")
    .map(line => `# ${line}`)
    .join("\n")}
`;
}
