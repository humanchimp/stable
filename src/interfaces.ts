import {
  CliArgKey,
  OptionType,
  ConfigOutputFormat,
  StreamFormat,
  CliCommandKey,
} from "./enums";
import { StablercFile } from "./cli/stablerc/StablercFile";
import { CliArgs, StablercPluginDefinition } from "./types";
import { ModuleFormat, RollupBuild } from "rollup";
import { Stream } from "most";

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
  it(description: string, test?: Effect, options?: SpecOptions): Suite;
  xit(description: string, test?: Effect, options?: SpecOptions): Suite;
  fit(description: string, test: Effect, options?: SpecOptions): Suite;
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
  run(
    sort?: Sorter,
    predicate?: JobPredicate,
  ): AsyncIterableIterator<Plan | Report | Summary>;
  open(): AsyncIterableIterator<Report>;
  close(): AsyncIterableIterator<Report>;
  runSpec(spec: Spec): AsyncIterableIterator<Report>;
}

export interface SpecOptions {
  test?: Effect;
  focused?: boolean;
  skipped?: boolean;
}

export interface SpecParams extends SpecOptions {
  description: string;
  parent?: Suite;
}

export interface Spec extends SpecParams {
  meta: SpecMeta;
  timeout(ms: number): Spec;
  run(): AsyncIterableIterator<Report>;
}

export interface SpecMeta {
  timeout?: number;
  infos?: any[];
}

export interface Job {
  spec: Spec;
  suite: Suite;
  series: number;
}

export interface Report extends SpecOptions {
  description: string;
  ok?: boolean;
  reason?: any;
  startedAt?: number;
  endedAt?: number;
  elapsed?: number;
  suite?: Suite;
  [key: string]: any;
}

export interface Plan {
  total: number;
  planned: number;
  userAgent?: string;
}

export interface Summary {
  total: number;
  planned: number;
  completed: number;
  ok: number;
  skipped: number;
  userAgent?: string;
}

export interface CoverageMessage {
  __coverage__: any;
}

export interface EndSignal {
  __end__: boolean;
}

export interface ConsoleMessage {
  console: any;
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
  (report: Report, continuation: Effect): void;
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
  skip?: DslDescribeBlock;
  only?: DslDescribeBlock;
  each?: DslDescribeEachBlock;
}

export interface DslDescribeEachBlock {
  (description: string, table: any, closure: DslTableClosure): Suite;
  skip?: DslDescribeEachBlock;
  only?: DslDescribeEachBlock;
}

export interface DslItBlock {
  (description: string, closure: SpecClosure): Spec;
  skip?: DslItBlock;
  only?: DslItBlock;
}

export interface DslHookBlock {
  (closure: HookClosure): Promise<any> | void;
}

export interface DslInfoBlock {
  (...rest: any[]): void;
}

export interface CommandParams {
  name: CliCommandKey;
  emoji: string;
  args: CliArgKey[];
  help?: string;
  default?: boolean;
}

export interface Command {
  name: CliCommandKey;
  emoji: string;
  args: Set<CliArgKey>;
  help: string;
  default: boolean;
  validateOptions(options: CliArgs): void;
}

export interface CommandParse {
  command: Command;
  options: CliArgs;
  invalid: string[];
  rest: string[];
  isDefault?: boolean;
}

export interface OptionSampler {
  (splat: any[]): any;
}

export interface OptionExpander {
  (value: any, option: Option, menu: Menu): IterableIterator<[CliArgKey, any]>;
}

export interface Option {
  name: CliArgKey;
  short: string;
  help: string;
  type: OptionType;
  default: any;
  command: CliCommandKey;
  sample: OptionSampler;
  expander: OptionExpander;
  expand(value: any, menu: Menu): IterableIterator<[CliArgKey, any]>;
}

export interface OptionParse {
  name: CliArgKey;
  option: Option;
  hasValue: boolean;
  negated: boolean;
  splat: (string | boolean | number)[];
}

export interface OptionParams {
  name: CliArgKey;
  short?: string;
  help: string;
  type: OptionType;
  default?: any;
  command?: CliCommandKey;
  sample?: OptionSampler;
  expand?: OptionExpander;
}

export interface Menu {
  commands: Map<string, Command>;
  options: Map<string, Option>;
  commandFromArgv(argv: string[]): CommandParse;
  runFromArgv(argv: string[], tasks: Map<string, Task>): Promise<void>;
}

export interface MenuParams {
  commands: Command[];
  options: Option[];
  debug?: boolean;
}

export interface TaskRun {
  (args: any, command: Command, menu: Menu): void;
}

export interface Task {
  run: TaskRun;
}

export interface TestRun {
  (code, options): Stream<any>;
}

export interface CommandChoice {
  name: CliCommandKey;
  args: CliArgKey[];
}

export interface StablercFileLoadParams {
  plugins?: boolean;
  cwd?: string;
}

export interface StablercPlugin {
  config: any;
  plugin: {
    package: any;
    provides: any;
    config: any;
  };
  rollupPlugins: any[];
}

export interface StablercDocument {
  extends?: string[];
  include?: string[];
  exclude?: string[];
  runners?: Runner[];
  plugins?: StablercPluginDefinition[];
}

export interface Runner {}

export interface StablercFile {
  filename: string;
  document: StablercDocument;
  plugins: boolean;
  withPlugins(): StablercFile;
  loadedPlugins: Promise<Map<string, StablercPlugin>>;
}

export interface StablercChain {
  plugins: boolean;
  inheritance: StablercEntry[];
  flat(): StablercFile;
}

export interface StablercChainParams {
  inheritance?: StablercEntry[];
  plugins?: boolean;
}

export interface StablercEntry {
  filename: string;
  file: StablercFile;
}

export interface StablercMatch {
  config: StablercFile;
  files: string[];
}

export interface StablercFileParams {
  document: StablercDocument;
  filename?: string;
  plugins?: boolean;
}

export interface Bundle {
  runner: string;
  matches: Set<StablercMatch>;
  addMatch(match: StablercMatch): Bundle;
  rollup(): Promise<RollupBuild>;
}

export interface SpecEntry {
  entry: string;
  stablerc: string;
}

export interface LogEffect {
  (...rest: any[]): void;
}

export interface PrintConfigTaskParams {
  [CliArgKey.WORKING_DIRECTORY]: string;
  [CliArgKey.OUTPUT_FORMAT]: ConfigOutputFormat;
  [CliArgKey.LIST_BY_SPEC]: boolean;
  [CliArgKey.REST]: string[];
  [CliArgKey.VERBOSE]: boolean;
  log: LogEffect;
}

export interface StablercTaskParams {
  [CliArgKey.WORKING_DIRECTORY]: string;
  [CliArgKey.REST]: string[];
}

export interface BundleTaskParams extends StablercTaskParams {
  [CliArgKey.ROLLUP]: string;
  [CliArgKey.ONREADY]: string;
  [CliArgKey.BUNDLE_FILE]: string;
  [CliArgKey.BUNDLE_FORMAT]: ModuleFormat;
  [CliArgKey.COVERAGE]: boolean;
  [CliArgKey.VERBOSE]: boolean;
  [CliArgKey.RUNNER]: string;
  [CliArgKey.FORCE]: boolean;
}

export interface RunTaskParams extends BundleTaskParams {
  [CliArgKey.SORT]: string;
  [CliArgKey.FILTER]: string;
  [CliArgKey.GREP]: string;
  [CliArgKey.PARTITION]: number;
  [CliArgKey.PARTITIONS]: number;
  [CliArgKey.QUIET]: boolean;
  [CliArgKey.RUNNER]: string;
  [CliArgKey.FORCE]: boolean;
  [CliArgKey.OUTPUT_FORMAT]: StreamFormat;
  [CliArgKey.HIDE_SKIPS]: boolean | "focus";
  [CliArgKey.FAIL_FAST]: boolean;
  [CliArgKey.PORT]?: string;
}

export interface LoadedConfigs {
  seen: Map<string, Set<any>>;
  configs: any[];
}

export interface LoadedPlugins extends LoadedConfigs {
  plugins: Map<any, Promise<StablercPlugin>>;
}
