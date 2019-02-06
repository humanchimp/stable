import { CliArgKey, OptionType, ConfigOutputFormat } from "./enums";
import { StablercFile } from "./stablerc/StablercFile";
import { CliArgs } from "./types";
import { arch } from "os";

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

export interface Task {
  run(args: any, command: Command, menu: Menu): void;
}

export interface CommandChoice extends Named {
  args: CliArgKey[];
}

export interface PrintConfigTaskParams {
  "working-directory": string;
  "output-format": ConfigOutputFormat;
  "list-by-spec": boolean;
  rest: string[];
  verbose: boolean;
  log: LogEffect;
}

export interface LogEffect {
  (...rest: any[]): void;
}

export interface StablercFromFileParams {
  plugins: boolean;
}

export interface StablercPlugin {}

export interface StablercDocument {
  extends?: string[];

  include?: string[];

  exclude?: string[];

  runners?: Runner[];

  plugins?: StablercPlugin[];
}

export interface Runner {}

export interface StablercChain {
  filename: string;

  plugins: boolean;

  inheritance: StablercEntry[];
}

export interface StablercChainParams {
  inheritance?: StablercEntry[];

  plugins: boolean;
}

export interface StablercEntry {
  filename: string;

  file: StablercFile;

  // type: StablercEntry.TYPE;
}

export interface StablercFileParams {
  filename: string;

  document: StablercDocument;
}

export interface SpecEntry {
  entry: string;

  stablerc: string;
}
