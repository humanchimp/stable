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
  andParents(): IterableIterator<Suite>;
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
    options?: SuiteParams,
  ): Suite;
  xdescribeEach(
    description: string,
    table: any[],
    closure: TableClosure,
    options?: SuiteParams,
  ): Suite;
  fdescribeEach(
    description: string,
    table: any[],
    closure: TableClosure,
    options?: SuiteParams,
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
  open(): AsyncIterableIterator<Report>;
  close(): AsyncIterableIterator<Report>;
}

export interface SpecParams {
  description: string;
  test?: Effect;
  focused?: boolean;
  skipped?: boolean;
}

export interface Spec extends SpecParams {
  meta: SpecMeta;
  timeout(ms: number): Spec;
  shouldFail(): Spec;
  rescue(rescuer: ErrorHandler): Spec;
}

export interface SpecMeta {
  shouldFail?: boolean;
  timeout?: number;
  rescuer?: ErrorHandler;
}

export interface Job {
  spec: Spec;
  suite: Suite;
  series: number;
}

export interface Report extends SpecParams {
  ok?: boolean;
  reason?: any;
  startedAt?: number;
  endedAt?: number;
  elapsed?: number;
  shouldFail?: boolean;
  rescued?: boolean;
  [key: string]: any;
}

export interface Plan {
  total: number;
  planned: number;
}

export interface Summary {
  total: number;
  planned: number;
  completed: number;
  ok: number;
  skipped: number;
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

export interface SpecClosure {
  (): void;
}

export interface HookClosure {
  (): void;
}

export interface JobPredicate {
  (job: Job): boolean;
}

export interface Sorter {
  (array: any[]): any[];
}

export interface ListenersParam {
  pending?: Listener[];
  complete?: Listener[];
}

export interface Range {
  start: number;
  end: number;
}

export interface RunGenerator {
  (
    suites: Suite | Suite[],
    sort?: Sorter,
    predicate?: JobPredicate,
  ): AsyncIterableIterator<any>;
}

export interface RunParams {
  generate?: RunGenerator;
  sort?: Sorter;
  predicate?: JobPredicate;
  perform?(any): any;
}

export interface DslParams {
  code: string;
  description?: string;
  helpers?: DslHelpers;
  listeners?: ListenersParam;
}

export interface DslHelpers {
  [key: string]: any;
}

export interface DslThunk {
  (
    describe: DslDescribeBlock,
    xdescribe: DslDescribeBlock,
    fdescribe: DslDescribeBlock,
    describeEach: DslDescribeEachBlock,
    xdescribeEach: DslDescribeEachBlock,
    fdescribeEach: DslDescribeEachBlock,
    it: DslItBlock,
    xit: DslItBlock,
    fit: DslItBlock,
    beforeAll: DslHookBlock,
    afterAll: DslHookBlock,
    beforeEach: DslHookBlock,
    afterEach: DslHookBlock,
    info: DslInfoBlock,
  ): void;
}

export interface DslSuiteClosure {
  (): void;
}

export interface DslTableClosure {
  (table: any): void;
}

export interface DslDescribeBlock {
  (description: string, closure: DslSuiteClosure): Suite;
}

export interface DslDescribeEachBlock {
  (description: string, table: any, closure: DslTableClosure): Suite;
}

export interface DslItBlock {
  (description: string, closure: SpecClosure): Spec;
}

export interface DslHookBlock {
  (closure: HookClosure): Promise<any> | void;
}

export interface DslInfoBlock {
  (...rest: any[]): void;
}
