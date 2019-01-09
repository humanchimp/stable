import {
  Suite as SuiteInterface,
  SuiteParams,
  SuiteClosure,
  Spec as SpecInterface,
  Job,
  Effect,
  Report,
  Plan,
  Summary,
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
import { Spec } from "./Spec";

const { assign } = Object;

interface ComputedHooks {
  beforeEach: Effect[];

  afterEach: Effect[];
}

export class Suite implements SuiteInterface {
  static from(suites: Suite[]): Suite {
    return suites.length === 1
      ? suites[0]
      : suites.reduce((memo, suite) => {
          memo.suites.push(suite);
          return memo;
        }, new this(null));
  }

  static of(...suites: Suite[]): Suite {
    return this.from(suites);
  }

  description: string;

  skipped: boolean;

  focused: boolean;

  suites: SuiteInterface[] = [];

  parent?: SuiteInterface;

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
      for (const suite of this.suites) {
        suite.isFocusMode = true;
      }
    }
  }

  get isDeeplyFocused() {
    if (this.specs.some(spec => spec.focused)) {
      return true;
    }
    return this.suites.some(suite => suite.focused || suite.isDeeplyFocused);
  }

  info(info: any = required()): Suite {
    this.specs.push(
      new Spec({
        description: descriptionForInfo(info),
        skipped: true,
      }),
    );
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
    this.specs.push(
      new Spec({
        description,
        test,
        skipped: test == null || this.skipped,
        focused: this.focused,
      }),
    );
    return this;
  }

  fit(description: string, test: Effect = required()): Suite {
    this.isFocusMode = true;
    this.specs.push(
      new Spec({
        description,
        test,
        focused: true,
        skipped: this.skipped,
      }),
    );
    return this;
  }

  xit(description: string = required(), test?: Effect): Suite {
    this.specs.push(
      new Spec({
        description,
        test,
        skipped: true,
        focused: this.focused,
      }),
    );
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
    options?: SuiteParams,
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
    options?: SuiteParams,
  ): Suite {
    this.describe(description, closure, { ...options, focused: true });
    return this;
  }

  xdescribe(
    description: string,
    closure: SuiteClosure,
    options?: SuiteParams,
  ): Suite {
    this.describe(description, closure, { ...options, skipped: true });
    return this;
  }

  describeEach(
    description: string,
    table: any[],
    closure: TableClosure = required(),
    options?: SuiteParams,
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
    options?: SuiteParams,
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
    options?: SuiteParams,
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

  *andParents(): IterableIterator<SuiteInterface> {
    let suite: SuiteInterface = this;

    do {
      yield suite;
    } while ((suite = suite.parent));
  }

  prefixed(description: string): string {
    const segments = [];

    for (const node of this.andParents()) {
      segments.unshift(node.description);
    }
    return [...segments, description].filter(Boolean).join(" ");
  }

  async *run(
    sort: Sorter = shuffle,
    predicate: JobPredicate = Boolean,
  ): AsyncIterableIterator<Plan | Report | Summary> {
    const jobs = [...this.orderedJobs()];
    const planned = jobs.filter(predicate);
    const counts = {
      total: jobs.length,
      planned: planned.length,
      completed: 0,
      ok: 0,
      skipped: 0,
    };

    yield {
      total: counts.total,
      planned: counts.planned,
    } as Plan;
    for await (const report of this.reportsForJobs(jobs, sort, predicate)) {
      if (report.ok) {
        counts.ok += 1;
      }
      if (report.skipped) {
        counts.skipped += 1;
      }
      counts.completed += 1;
      yield report;
    }
    yield {
      ...counts,
      failed: counts.completed - counts.ok,
    } as Summary;
  }

  async *reports(
    sort: Sorter = shuffle,
    predicate: JobPredicate = Boolean,
  ): AsyncIterableIterator<Report> {
    yield* this.reportsForJobs([...this.orderedJobs()], sort, predicate);
  }

  private async *reportsForJobs(
    jobs: Job[],
    sort: Sorter,
    predicate: JobPredicate,
  ) {
    const preparedJobs: Job[] = sort(jobs)
      .map((suite, index) => {
        suite.series = index;
        return suite;
      })
      .filter(predicate);
    const counted = this.countSpecsBySuite(preparedJobs);
    const poisoned = new Set();

    for (const { spec, suite } of preparedJobs) {
      const instance = suite as Suite;

      if (!poisoned.has(instance)) {
        try {
          yield* await instance.open();
          yield* await instance.runSpec(spec);
        } catch (_) {
          poisoned.add(instance);
        }
      }
      yield* await this.countSpec(counted, suite);
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

  async *open(): AsyncIterableIterator<Report> {
    if (this.opened) {
      return;
    }
    for (const hook of this.hooks.run("beforeAll")) {
      yield* await this.runHook(hook, this.description);
    }
    this.opened = true;
  }

  async *close(): AsyncIterableIterator<Report> {
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
    meta,
  }: SpecInterface): Promise<Report> {
    description = this.prefixed(description);

    if (skipped || (this.isFocusMode && !focused)) {
      return {
        description,
        ok: true,
        skipped: true,
        ...meta,
      };
    }
    const report: Report = { ...this.defaultOptions(), description };

    if (focused) {
      report.focused = true;
    }

    assign(report, meta);

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
    const suites = [...this.andParents()];
    const afterEach = flatMap(suites, suite => suite.hooks.afterEach);
    const beforeEach = flatMap(
      suites.reverse(),
      suite => suite.hooks.beforeEach,
    );

    this.computedHooks = { beforeEach, afterEach };
  }

  private countSpecsBySuite(jobs: Job[]): Map<SuiteInterface, number> {
    return jobs.reduce((memo, { suite }: Job) => {
      for (const s of suite.andParents()) {
        inc(memo, s, 1);
      }
      return memo;
    }, new Map<SuiteInterface, number>());
  }

  private async *countSpec(
    counted: Map<SuiteInterface, number>,
    suite: SuiteInterface,
  ) {
    for (const s of suite.andParents()) {
      if (inc(counted, s, -1) === 0) {
        yield* await s.close();
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

function descriptionForRow(description, table) {
  return `${description} [table]`;
}

function descriptionForInfo(info) {
  // Do something reasonable in different scenarios, but for now...
  return info;
}

function required(): any {
  throw new Error("required");
}

function inc(map, key, offset) {
  const [initial = 0] = [map.get(key)];
  const next = initial + offset;

  map.set(key, next);
  return next;
}
