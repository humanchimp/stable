import { shuffle } from "./shuffle";

export function describe(description, closure) {
  const suite = new Suite(description);

  if (closure != null) {
    closure(suite);
  }
  return suite;
}

export async function run(suites, next = console.log) {
  for (const suite of shuffle(suites.slice())) {
    for await (const result of suite.tap()) {
      next(result);
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
  constructor(description, parent, skipped = false) {
    this.description = description;
    this.parent = parent;
    this.skipped = skipped;
    this.hooks = new Hooks();
    this.specs = [];
    this.suites = [];
    this.focused = false;
  }

  url(url) {
    this.meta || (this.meta = {});
    this.meta.url = url;
    return this;
  }

  meta(meta) {
    this.meta = meta;
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

  fit(description, test) {
    this.focused = true;
    this.specs.push({ description, test, focused: true });
    return this;
  }

  xit(description, test) {
    this.specs.push({ description, test, skipped: true });
    return this;
  }

  it(description, test) {
    this.specs.push({ description, test, skipped: this.skipped });
    return this;
  }

  describe(description, closure = required(), skipped = false) {
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
    let count = 0;
    for await (const { ok, description, reason } of this.run()) {
      yield `${ok ? "" : "not "}ok ${++count} - ${description}${formatReason(
        reason
      )}`;
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

function required() {
  throw new Error("required");
}
