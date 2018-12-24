import {
  Suite as SuiteInterface,
  SuiteParams,
  SuiteClosure,
  Spec,
  Job,
  Effect,
  Report,
  Hooks as HooksInterface,
  Listeners as ListenersInterface,
  TableClosure,
  JobPredicate,
  Sorter,
} from "./interfaces";
import { shuffle } from "./shuffle";
import { Hooks } from "./Hooks";
import { Listeners } from "./Listeners";
import { flatMap } from "./flatMap";

interface ComputedHooks {
  beforeEach: Effect[];

  afterEach: Effect[];
}

export class Suite implements SuiteInterface {
  description: string;

  parent?: SuiteInterface;

  skipped: boolean;

  focused: boolean;

  suites: SuiteInterface[] = [];

  specs: Spec[] = [];

  hooks: HooksInterface = new Hooks();

  listeners: ListenersInterface;

  private focusMode: boolean = false;

  private opened: boolean = false;

  private computedHooks: ComputedHooks;

  constructor(
    description: string = required(),
    {
      parent = undefined,
      skipped = false,
      focused = false,
      listeners = undefined,
    }: SuiteParams = {},
  ) {
    this.description = description;
    this.parent = parent;
    this.skipped = skipped;
    this.focused = focused;
    this.listeners = new Listeners(listeners);
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

  info(info: any): Suite {
    this.specs.push({
      description: descriptionForInfo(info),
      skipped: true,
    });
    return this;
  }

  beforeAll(hook: Effect = required()): Suite {
    this.hooks.beforeAll.push(hook);
    return this;
  }

  afterAll(hook: Effect = required()): Suite {
    this.hooks.afterAll.unshift(hook);
    return this;
  }

  beforeEach(hook: Effect = required()): Suite {
    this.hooks.beforeEach.push(hook);
    return this;
  }

  afterEach(hook: Effect = required()): Suite {
    this.hooks.afterEach.unshift(hook);
    return this;
  }

  it(description: string = required(), test?: Effect): Suite {
    this.specs.push({
      description,
      test,
      skipped: test == null || this.skipped,
      focused: this.focused,
    });
    return this;
  }

  fit(description: string, test: Effect = required()): Suite {
    this.isFocusMode = true;
    this.specs.push({
      description,
      test,
      focused: true,
      skipped: this.skipped,
    });
    return this;
  }

  xit(description: string = required(), test?: Effect): Suite {
    this.specs.push({
      description,
      test,
      skipped: true,
      focused: this.focused,
    });
    return this;
  }

  defaultOptions(options?: SuiteParams): SuiteParams {
    return {
      ...options,
      ...(this.skipped && { skipped: true }),
      ...(this.focused && { focused: true }),
    };
  }

  describe(
    description: string,
    closure: SuiteClosure = required(),
    options: SuiteParams,
  ): Suite {
    const suite = new Suite(description, {
      ...this.defaultOptions(options),
      ...(this.listeners && { listeners: this.listeners }),
      parent: this,
    });

    closure(suite);
    this.suites.push(suite);
    return this;
  }

  fdescribe(
    description: string,
    closure: SuiteClosure,
    options: SuiteParams,
  ): Suite {
    this.describe(description, closure, { ...options, focused: true });
    return this;
  }

  xdescribe(
    description: string,
    closure: SuiteClosure,
    options: SuiteParams,
  ): Suite {
    this.describe(description, closure, { ...options, skipped: true });
    return this;
  }

  describeEach(
    description: string,
    table: any[],
    closure: TableClosure = required(),
    options: SuiteParams,
  ): Suite {
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

  fdescribeEach(
    description: string,
    table: any[],
    closure: TableClosure,
    options: SuiteParams,
  ): Suite {
    this.describeEach(description, table, closure, {
      ...options,
      focused: true,
    });
    return this;
  }

  xdescribeEach(
    description: string,
    table: any[],
    closure: TableClosure,
    options: SuiteParams,
  ): Suite {
    this.describeEach(description, table, closure, {
      ...options,
      skipped: true,
    });
    return this;
  }

  *orderedJobs(): IterableIterator<Job> {
    let series = 0;

    for (const spec of this.specs) {
      yield { suite: this, spec, series: series++ };
    }

    for (const suite of this.suites) {
      for (const tuple of suite.orderedJobs()) {
        yield { ...tuple, series: series++ };
      }
    }
  }

  *parents(): IterableIterator<SuiteInterface> {
    let suite: SuiteInterface = this;

    do {
      yield suite;
    } while ((suite = suite.parent));
  }

  prefixed(description: string): string {
    const segments = [];

    for (const node of this.parents()) {
      segments.unshift(node.description);
    }
    return [...segments, description].filter(Boolean).join(" ");
  }

  async *reports(
    sort: Sorter = shuffle,
    predicate: JobPredicate = Boolean,
  ): AsyncIterableIterator<Report> {
    const jobs: Job[] = sort([...this.orderedJobs()])
      .map((suite, index) => {
        suite.series = index;
        return suite;
      })
      .filter(predicate);
    const counted = countSpecsBySuite(jobs);
    const poisoned = new Set();

    for (const { spec, suite } of jobs) {
      const instance = suite as Suite;

      if (!poisoned.has(instance)) {
        try {
          yield* await instance.open();
          yield* await instance.runSpec(spec);
        } catch (_) {
          poisoned.add(instance);
        }
      }
      yield* await countSpec(counted, suite);
    }
  }

  private async *runHook(hook, description): AsyncIterableIterator<Report> {
    const reason = await runTest(hook.effect);

    if (reason != null) {
      yield {
        reason,
        description: `${hook.name}: ${description}`,
        ok: false,
      };
      throw reason;
    }
  }

  private async *runSpec(spec): AsyncIterableIterator<Report> {
    this.computeHooks();
    if (!spec.skipped) {
      for (const effect of this.computedHooks.beforeEach) {
        yield* await this.runHook(
          { name: "beforeEach", effect },
          spec.description,
        );
      }
    }
    yield await this.reportForSpec(spec);
    if (!spec.skipped) {
      for (const effect of this.computedHooks.afterEach) {
        yield* await this.runHook(
          { name: "afterEach", effect },
          spec.description,
        );
      }
    }
  }

  private async *open(): AsyncIterableIterator<Report> {
    if (this.opened) {
      return;
    }
    for (const hook of this.hooks.run("beforeAll")) {
      yield* await this.runHook(hook, this.description);
    }
    this.opened = true;
  }

  private async *close(): AsyncIterableIterator<Report> {
    if (!this.opened) {
      return;
    }
    for (const hook of this.hooks.run("afterAll")) {
      yield* await this.runHook(hook, this.description);
    }
    this.opened = false;
  }

  private async reportForSpec({
    description,
    test,
    focused,
    skipped,
  }: Spec): Promise<Report> {
    description = this.prefixed(description);

    if (skipped || (this.isFocusMode && !focused)) {
      return {
        description,
        ok: true,
        skipped: true,
      };
    }
    const report: Report = { ...this.defaultOptions(), description };

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

  private computeHooks(): void {
    if (this.computedHooks != null) {
      return;
    }
    const suites = [...this.parents()];
    const afterEach = flatMap(suites, suite => suite.hooks.afterEach);
    const beforeEach = flatMap(
      suites.reverse(),
      suite => suite.hooks.beforeEach,
    );

    this.computedHooks = { beforeEach, afterEach };
  }
}

async function runTest(test) {
  try {
    await test();
  } catch (reason) {
    return reason;
  }
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

function required(): any {
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