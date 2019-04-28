declare enum CliArgKey {
    FILTER = "filter",
    GREP = "grep",
    RUNNER = "runner",
    FORCE = "force",
    OUTPUT_FORMAT = "output-format",
    WORKING_DIRECTORY = "working-directory",
    READ_STDIN = "read-stdin",
    QUIET = "quiet",
    VERBOSE = "verbose",
    ORDERED = "ordered",
    SORT = "sort",
    HELP = "help",
    ROLLUP = "rollup",
    ONREADY = "onready",
    BUNDLE_FILE = "bundle-file",
    BUNDLE_FORMAT = "bundle-format",
    SEED = "seed",
    PARTITIONS = "partitions",
    PARTITION = "partition",
    SHARD = "shard",
    PORT = "port",
    HIDE_SKIPS = "hide-skips",
    FAIL_FAST = "fail-fast",
    HEADFUL = "headful",
    COVERAGE = "coverage",
    REST = "rest",
    LIST_BY_SPEC = "list-by-spec"
}
declare enum CliCommandKey {
    RUN = "run",
    BUNDLE = "bundle",
    CONFIG = "config",
    HELP = "help",
    PARSE_OPTIONS = "parse-options"
}
declare enum OptionType {
    BOOLEAN = "boolean",
    STRING = "string",
    NUMBER = "number",
    STRING_OR_BOOLEAN = "string or boolean"
}
interface StablercFile {
}
interface ISuite {
    description: String;
    parent?: ISuite;
    skipped: boolean;
    focused: boolean;
    suites: ISuite[];
    specs: ISpec[];
    hooks: Hooks;
    listeners: Listeners;
    isFocusMode: boolean;
    isDeeplyFocused: boolean;
    orderedJobs(): IterableIterator<Job>;
    andParents(): IterableIterator<ISuite>;
    describe(description: string, closure: SuiteClosure, options?: SuiteParams): ISuite;
    xdescribe(description: string, closure: SuiteClosure, options?: SuiteParams): ISuite;
    fdescribe(description: string, closure: SuiteClosure, options?: SuiteParams): ISuite;
    describeEach(description: string, table: any[], closure: TableClosure, options?: SuiteParams): ISuite;
    xdescribeEach(description: string, table: any[], closure: TableClosure, options?: SuiteParams): ISuite;
    fdescribeEach(description: string, table: any[], closure: TableClosure, options?: SuiteParams): ISuite;
    it(description: string, test?: Effect, options?: SpecOptions): ISuite;
    xit(description: string, test?: Effect, options?: SpecOptions): ISuite;
    fit(description: string, test: Effect, options?: SpecOptions): ISuite;
    beforeAll(hook: Effect): ISuite;
    beforeEach(hook: Effect): ISuite;
    afterAll(hook: Effect): ISuite;
    afterEach(hook: Effect): ISuite;
    info(info: any): ISuite;
    prefixed(description: string): string;
    reports(sort?: Sorter, predicate?: JobPredicate): AsyncIterableIterator<Report>;
    run(sort?: Sorter, predicate?: JobPredicate): AsyncIterableIterator<Plan | Report | Summary>;
    open(): AsyncIterableIterator<Report>;
    close(): AsyncIterableIterator<Report>;
    runSpec(spec: ISpec): AsyncIterableIterator<Report>;
}
interface SpecOptions {
    test?: Effect;
    focused?: boolean;
    skipped?: boolean;
}
interface SpecParams extends SpecOptions {
    description: string;
    parent?: ISuite;
}
interface ISpec extends SpecParams {
    meta: SpecMeta;
    timeout(ms: number): ISpec;
    run(): AsyncIterableIterator<Report>;
}
interface SpecMeta {
    timeout?: number;
    infos?: any[];
}
interface Job {
    spec: ISpec;
    suite: ISuite;
    series: number;
}
interface Report extends SpecOptions {
    description: string;
    ok?: boolean;
    reason?: any;
    startedAt?: number;
    endedAt?: number;
    elapsed?: number;
    suite?: ISuite;
    [key: string]: any;
}
interface Plan {
    total: number;
    planned: number;
    userAgent?: string;
}
interface Summary {
    total: number;
    planned: number;
    completed: number;
    ok: number;
    skipped: number;
    userAgent?: string;
}
interface CoverageMessage {
    __coverage__: any;
}
interface ConsoleMessage {
    console: any;
}
interface SuiteParams {
    parent?: ISuite;
    skipped?: boolean;
    focused?: boolean;
    listeners?: ListenersParam;
}
interface Listeners {
    pending: Listener[];
    complete: Listener[];
}
interface Listener {
    (report: Report, continuation: Effect): void;
}
interface Hooks {
    beforeAll: Effect[];
    afterAll: Effect[];
    beforeEach: Effect[];
    afterEach: Effect[];
    run(hookName: string): IterableIterator<Hook>;
}
interface Hook {
    name: string;
    effect: Effect;
}
interface Effect {
    (...rest: any[]): void;
}
interface SuiteClosure {
    (suite: ISuite): void;
}
interface TableClosure {
    (suite: ISuite, table: any[]): void;
}
interface JobPredicate {
    (job: Job): boolean;
}
interface Sorter {
    (array: any[]): any[];
}
interface ListenersParam {
    pending?: Listener[];
    complete?: Listener[];
}
interface RunGenerator {
    (suites: ISuite | ISuite[], sort?: Sorter, predicate?: JobPredicate): AsyncIterableIterator<any>;
}
interface RunParams {
    generate?: RunGenerator;
    sort?: Sorter;
    predicate?: JobPredicate;
    perform?(any: any): any;
}
interface Command {
    name: CliCommandKey;
    emoji: string;
    args: Set<CliArgKey>;
    help: string;
    default: boolean;
    validateOptions(options: CliArgs): void;
}
interface CommandParse {
    command: Command;
    options: CliArgs;
    invalid: string[];
    rest: string[];
    isDefault?: boolean;
}
interface OptionSampler {
    (splat: any[]): any;
}
interface OptionExpander {
    (value: any, option: Option, menu: Menu): IterableIterator<[CliArgKey, any]>;
}
interface Option {
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
interface Menu {
    commands: Map<string, Command>;
    options: Map<string, Option>;
    commandFromArgv(argv: string[]): CommandParse;
    runFromArgv(argv: string[], tasks: Map<string, Task>): Promise<void>;
}
interface TaskRun {
    (args: any, command: Command, menu: Menu): void;
}
interface Task {
    run: TaskRun;
}
interface StablercFileLoadParams {
    plugins?: boolean;
    cwd?: string;
}
interface StablercPlugin {
    config: any;
    plugin: {
        package: any;
        provides: any;
        config: any;
    };
    rollupPlugins: any[];
}
interface StablercDocument {
    extends?: string[];
    include?: string[];
    exclude?: string[];
    runners?: Runner[];
    plugins?: StablercPluginDefinition[];
}
interface Runner {
}
interface StablercFile {
    filename: string;
    document: StablercDocument;
    plugins: boolean;
    withPlugins(): StablercFile;
    loadedPlugins: Promise<Map<string, StablercPlugin>>;
}
interface StablercChainParams {
    inheritance?: StablercEntry[];
    plugins?: boolean;
}
interface StablercEntry {
    filename: string;
    file: StablercFile;
}
interface StablercMatch {
    config: StablercFile;
    files: string[];
}
interface StablercFileParams {
    document: StablercDocument;
    filename?: string;
    plugins?: boolean;
}
declare type CliArgs = {
    [P in CliArgKey]?: any;
};
declare type Splat<T> = T | T[];
declare type StablercPluginDefinition = [string, any];
declare type Message = Plan | Report | Summary | CoverageMessage | ConsoleMessage;
declare class Spec implements ISpec {
    description: string;
    test: Effect;
    focused: boolean;
    skipped: boolean;
    meta: SpecMeta;
    parent: ISuite;
    constructor({ description, parent, test, focused, skipped, }: SpecParams);
    timeout(ms: number): Spec;
    info(info: any): this;
    run(): AsyncIterableIterator<Report>;
}
declare function shuffleRng(rng: any): (array: any) => any;
interface Shuffle extends Sorter {
    rng: (rng: () => number) => Sorter;
}
declare const shuffle: Shuffle;
declare type HooksInterface_$0 = Hooks;
declare type ListenersInterface_$0 = Listeners;
declare class Suite implements ISuite {
    static empty(): Suite;
    static from(suites: Suite[]): Suite;
    static of(...suites: Suite[]): Suite;
    static reducer(a: Suite, b: Suite): Suite;
    description: string;
    skipped: boolean;
    focused: boolean;
    suites: ISuite[];
    parent?: ISuite;
    specs: Spec[];
    hooks: HooksInterface_$0;
    listeners: ListenersInterface_$0;
    private focusMode;
    private opened;
    private computedHooks;
    constructor(description?: string, { parent, skipped, focused, listeners, }?: SuiteParams);
    isFocusMode: boolean;
    readonly isDeeplyFocused: boolean;
    info(info?: any): Suite;
    beforeAll(hook?: Effect): Suite;
    afterAll(hook?: Effect): Suite;
    beforeEach(hook?: Effect): Suite;
    afterEach(hook?: Effect): Suite;
    it(description?: string, test?: Effect, options?: SpecOptions): Suite;
    fit(description: string, test?: Effect, options?: SpecOptions): Suite;
    xit(description?: string, test?: Effect, options?: SpecOptions): Suite;
    defaultOptions(options?: SuiteParams): SuiteParams;
    describe(description: string, closure?: SuiteClosure, options?: SuiteParams): Suite;
    fdescribe(description: string, closure: SuiteClosure, options?: SuiteParams): Suite;
    xdescribe(description: string, closure: SuiteClosure, options?: SuiteParams): Suite;
    describeEach(description: string, table: any[], closure?: TableClosure, options?: SuiteParams): Suite;
    fdescribeEach(description: string, table: any[], closure: TableClosure, options?: SuiteParams): Suite;
    xdescribeEach(description: string, table: any[], closure: TableClosure, options?: SuiteParams): Suite;
    orderedJobs(): IterableIterator<Job>;
    andParents(): IterableIterator<ISuite>;
    prefixed(description: string): string;
    concat(...suites: Suite[]): Suite;
    run(sort?: Sorter, predicate?: JobPredicate): AsyncIterableIterator<Plan | Report | Summary>;
    reports(sort?: Sorter, predicate?: JobPredicate): AsyncIterableIterator<Report>;
    private reportsForJobs;
    private runHook;
    runSpec(spec: ISpec): AsyncIterableIterator<Report>;
    open(): AsyncIterableIterator<Report>;
    close(): AsyncIterableIterator<Report>;
    private reportForSpec;
    private computeHooks;
    private countSpecsBySuite;
    private countSpec;
}
declare function describe(description: string | null, closure?: SuiteClosure, options?: SuiteParams): Suite;
declare function run(suite: Suite): Promise<void>;
declare function run(suites: Suite[]): Promise<void>;
declare function run(suite: Suite, params: RunParams): Promise<void>;
declare function run(suites: Suite[], params: RunParams): Promise<void>;
declare function generator(suite: Suite): AsyncIterableIterator<Plan | Report | Summary>;
declare function generator(suites: Suite[]): AsyncIterableIterator<Plan | Report | Summary>;
declare function generator(suite: Suite, sort: Sorter): AsyncIterableIterator<Plan | Report | Summary>;
declare function generator(suites: Suite[], sort: Sorter): AsyncIterableIterator<Plan | Report | Summary>;
declare function generator(suite: Suite, sort: Sorter, predicate: JobPredicate): AsyncIterableIterator<Plan | Report | Summary>;
declare function generator(suites: Suite[], sort: Sorter, predicate: JobPredicate): AsyncIterableIterator<Plan | Report | Summary>;
declare function reports(suites: Suite | Suite[], sort?: Sorter, predicate?: JobPredicate): AsyncIterableIterator<Report>;
declare function plugins(pluginsHash: any): {
    listeners: Listeners;
};
declare function nearestStablerc(dir: string): Promise<string>;
declare class StablercFile_$0 implements StablercFileInterface {
    static nearest: typeof nearestStablerc;
    static forSpecs: typeof stablercsForSpecs;
    static splatDocument: typeof splatDocument;
    static load: typeof load;
    static loadAll: typeof loadAll;
    filename: string;
    document: StablercDocument;
    plugins: boolean;
    loadedPlugins: Promise<Map<any, StablercPlugin>>;
    constructor({ document, filename, plugins, }: StablercFileParams);
    withPlugins(): StablercFile_$0;
}
declare function splatDocument(document: any): {
    extends: any[];
    include: any[];
    exclude: any[];
    plugins: any;
    runners: any;
};
declare function load(filename: string, { plugins: shouldLoadPlugins }?: StablercFileLoadParams): Promise<StablercFile_$0>;
declare function loadAll(filename: string, params?: StablercFileLoadParams): Promise<Map<string, StablercFile_$0>>;
declare function loadAll(filename: string[], params?: StablercFileLoadParams): Promise<Map<string, StablercFile_$0>>;
declare class StablercChain_$0 implements StablercChainInterface {
    static loadAll_$0: typeof loadAll_$0;
    static load_$0: typeof load_$0;
    inheritance: StablercEntry[];
    plugins: boolean;
    constructor({ inheritance, plugins }?: StablercChainParams);
    flat(): StablercFile;
}
declare function loadAll_$0(filename: Splat<string>, params?: StablercFileLoadParams): Promise<Map<string, StablercChain_$0>>;
declare function load_$0(filename: string, params?: StablercFileLoadParams, files?: Map<string, StablercFile>): Promise<StablercChain_$0>;
declare function stablercsForSpecs(specfiles: string[]): Promise<Map<string, StablercMatch>>;
declare function skipped(report: Message): boolean;
export { shuffleRng, shuffle };
//# sourceMappingURL=cli-impl.d.ts.map