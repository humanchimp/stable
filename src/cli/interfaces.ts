import {
  CliArgKey,
  OptionType,
  ConfigOutputFormat,
  StreamFormat,
} from "./enums";
import { StablercFile } from "./stablerc/StablercFile";
import { CliArgs, StablercPluginDefinition } from "./types";
import { ModuleFormat } from "rollup";
import { Stream } from "most";

export interface Named {
  name: string;
}

export interface CommandParams extends Named {
  emoji: string;
  args: CliArgKey[];
  task: Task;
  help?: string;
  default?: boolean;
}

export interface Command extends Named {
  emoji: string;
  args: Set<CliArgKey>;
  help: string;
  task: Task;
  default: boolean;
  run(args: any, menu: Menu);
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

export interface Option extends Named {
  short?: string;
  help: string;
  type: OptionType;
  default?: any;
  task?: Task;
  sample?: OptionSampler;
}

export interface OptionParse extends Named {
  option: Option;
  hasValue: boolean;
  negated: boolean;
  splat: (string | boolean | number)[];
}

export interface OptionParams extends Named {
  short?: string;
  help: string;
  type: OptionType;
  default?: any;
  task?: Task;
  sample?: OptionSampler;
}

export interface Menu {
  commands: Map<string, Command>;
  options: Map<string, Option>;
  commandFromArgv(argv: string[]): CommandParse;
  runFromArgv(argv: string[]): Promise<void>;
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

export interface CommandChoice extends Named {
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
}

export interface RunTaskParams extends BundleTaskParams {
  [CliArgKey.SORT]: string;
  [CliArgKey.FILTER]: string;
  [CliArgKey.GREP]: string;
  [CliArgKey.PARTITION]: number;
  [CliArgKey.PARTITIONS]: number;
  [CliArgKey.QUIET]: boolean;
  [CliArgKey.RUNNER]: string;
  [CliArgKey.OUTPUT_FORMAT]: StreamFormat;
}
