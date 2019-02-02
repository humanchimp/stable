import {
  Command as CommandInterface,
  CommandParams,
  Task,
  Menu,
} from "./interfaces";
import { CliArgKey } from "./enums";
import { CliArgs } from "./types";

export class Command implements CommandInterface {
  static toleratedArgs = new Set<CliArgKey>([CliArgKey.HELP, CliArgKey.REST]);

  name: string;

  args: Set<CliArgKey>;

  help: string;

  task: Task;

  default: boolean;

  emoji: string;

  constructor({
    name,
    args,
    help,
    task,
    default: isDefault = false,
    emoji,
  }: CommandParams) {
    this.name = name;
    this.args = new Set<CliArgKey>(args);
    this.help = help;
    this.task = task;
    this.default = isDefault;
    this.emoji = emoji;
  }

  run(args: CliArgs, menu: Menu) {
    this.validateArgs(args);
    this.task.run(args, this, menu);
  }

  validateArgs(args: CliArgs): void {
    const invalidArgs = (Object.keys(args).filter(
      arg => arg !== "_",
    ) as CliArgKey[])
      .filter(arg => !Command.toleratedArgs.has(arg))
      .filter(arg => !this.args.has(arg));

    if (invalidArgs.length > 0) {
      throw new Error(`invalid arguments: ${invalidArgs.join(", ")}`);
    }
  }
}
