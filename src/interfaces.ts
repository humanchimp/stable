export interface Suite {
  description: String;
  parent?: Suite;
  skipped: boolean;
  focused: boolean;
  suites: Suite[];
  specs: Spec[];
  hooks: Hooks;
  listeners: Listeners;
  isFocusMode: boolean;
  isDeeplyFocused: boolean;
  orderedJobs(): IterableIterator<Job>;
  parents(): IterableIterator<Suite>;
  describe(
    description: string,
    closure: SuiteClosure,
    options?: SuiteParams,
  ): Suite;
  xdescribe(
    description: string,
    closure: SuiteClosure,
    options?: SuiteParams,
  ): Suite;
  fdescribe(
    description: string,
    closure: SuiteClosure,
    options?: SuiteParams,
  ): Suite;
  describeEach(
    description: string,
    table: any[],
    closure: TableClosure,
    options: SuiteParams,
  ): Suite;
  xdescribeEach(
    description: string,
    table: any[],
    closure: TableClosure,
    options: SuiteParams,
  ): Suite;
  fdescribeEach(
    description: string,
    table: any[],
    closure: TableClosure,
    options: SuiteParams,
  ): Suite;
  it(description: string, test?: Effect): Suite;
  xit(description: string, test?: Effect): Suite;
  fit(description: string, test: Effect): Suite;
  beforeAll(hook: Effect): Suite;
  beforeEach(hook: Effect): Suite;
  afterAll(hook: Effect): Suite;
  afterEach(hook: Effect): Suite;
  info(info: any): Suite;
  prefixed(description: string): string;
  reports(
    sort?: Sorter,
    predicate?: JobPredicate,
  ): AsyncIterableIterator<Report>;
}

export interface Spec {
  description: string;
  test?: Effect;
  focused?: boolean;
  skipped?: boolean;
}

export interface Job {
  spec: Spec;
  suite: Suite;
  series: number;
}

export interface Report extends Spec {
  ok?: boolean;
  reason?: any;
  [key: string]: any;
}

export interface SuiteParams {
  parent?: Suite;
  skipped?: boolean;
  focused?: boolean;
  listeners?: ListenersParam;
}

export interface Selection {
  filter?: string;
  grep?: RegExp;
  predicate: JobPredicate;
  partition(total: number, partition: number, partitions: number): JobPredicate;
}

export interface SelectionParams {
  filter?: string;
  grep?: RegExp;
}

export interface Listeners {
  pending: Listener[];
  complete: Listener[];
}

export interface Listener {
  (report: Report, continuation: Effect | ErrorHandler): void;
}

export interface Hooks {
  beforeAll: Effect[];
  afterAll: Effect[];
  beforeEach: Effect[];
  afterEach: Effect[];
  run(hookName: string): IterableIterator<Hook>;
}

export interface Hook {
  name: string;
  effect: Effect;
}

export interface Effect {
  (): void;
}

export interface ErrorHandler {
  (reason: Error): void;
}

export interface SuiteClosure {
  (suite: Suite): void;
}

export interface TableClosure {
  (suite: Suite, table: any[]): void;
}

export interface JobPredicate {
  (job: Job): boolean;
}

export interface Sorter {
  (array: any[]): any[];
}

export interface DslParams {
  code: string;
  description?: string;
  helpers?: DslHelpers;
  listeners?: ListenersParam;
  preludes?: string[];
}

export interface ListenersParam {
  pending?: Listener[];
  complete?: Listener[];
}

export interface DslHelpers {
  [key: string]: any;
}

export interface Range {
  start: number;
  end: number;
}

export interface RunParams {
  generate(suites: Suite[], sort: Sorter): AsyncIterableIterator<any>;
  perform(any): any;
  sort: Sorter;
}
