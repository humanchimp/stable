import {
  Command as CommandInterface,
  CommandParams,
  Task,
  Menu,
} from "./interfaces";
import { CliArgKey } from "./enums";

export class Command implements CommandInterface {
  name: string;

  args: Set<CliArgKey>;

  help: string;

  task: Task;

  default: boolean;

  constructor({
    name,
    args,
    help,
    task,
    default: isDefault = false,
  }: CommandParams) {
    this.name = name;
    this.args = new Set<CliArgKey>(args);
    this.help = help;
    this.task = task;
    this.default = isDefault;
  }

  run(args: any, menu: Menu) {
    this.validateArgs(args);
    this.task.run(args, this, menu);
  }

  validateArgs(args: any): void {
    const invalidArgs = Object.keys(args)
      .filter(arg => arg !== "_")
      .filter(arg => !new Set(this.args.keys()).has(args));

    if (invalidArgs.length > 0) {
      throw new Error(`invalid arguments: ${invalidArgs.join(", ")}`);
    }
  }
}
