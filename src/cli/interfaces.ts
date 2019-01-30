import {
  CliArgKey,
  OptionType,
  ConfigOutputFormat,
  StablercType,
} from "./enums";
import { StablercFile } from "./stablerc/StablercFile";

export interface CommandParams {
  name: string;
  emoji: string;
  args: CliArgKey[];
  task: Task;
  help?: string;
  default?: boolean;
}

export interface Command {
  name: string;
  emoji: string;
  args: Set<CliArgKey>;
  help: string;
  task: Task;
  default: boolean;
  run(args: any, menu: Menu);
}

export interface Option {
  name: string;
  short?: string;
  help: string;
  type: OptionType;
  default: any;
  task?: Task;
}

export interface OptionParams {
  name: string;
  short?: string;
  help: string;
  type: OptionType;
  default?: any;
  task?: Task;
}

export interface Menu {
  commands: Map<string, Command>;
  options: Map<string, Option>;
  findCommand(commandName: string): Command;
  selectFromArgv(argv: string[]): Promise<void>;
}

export interface MenuParams {
  commands: Command[];
  options: Option[];
}

export interface Task {
  run(args: any, command: Command, menu: Menu): void;
}

export interface CommandChoice {
  name: string;
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
