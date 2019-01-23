import { CliArgKey, OptionType } from "./enums";

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
