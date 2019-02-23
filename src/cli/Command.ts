import {
  Command as CommandInterface,
  CommandParams,
  Task,
  Menu,
} from "./interfaces";
import { CliArgKey } from "./enums";
import { CliArgs } from "./types";
import { ValidationError } from "./ValidationError";

export const toleratedArgs = new Set<CliArgKey>([
  CliArgKey.HELP,
  CliArgKey.REST,
]);

export class Command implements CommandInterface {
  static toleratedArgs = toleratedArgs;

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

  async run(options: CliArgs, menu: Menu): Promise<void> {
    this.validateOptions(options);
    await this.task.run(options, this, menu);
  }

  validateOptions(options: CliArgs): void {
    const invalidArgs = (Object.keys(options) as CliArgKey[])
      .filter(option => !toleratedArgs.has(option))
      .filter(option => !this.args.has(option));

    if (invalidArgs.length > 0) {
      throw new ValidationError(
        `invalid arguments: ${invalidArgs.join(", ")}`,
        {
          command: this,
          invalid: invalidArgs,
          options,
          rest: [],
        },
      );
    }
  }
}
