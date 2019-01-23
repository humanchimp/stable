import { Option as OptionInterface, OptionParams, Task } from "./interfaces";
import { OptionType } from "./enums";

export class Option implements OptionInterface {
  name: string;

  short: string;

  help: string;

  type: OptionType;

  default: any;

  task: Task;

  constructor({
    name,
    short,
    help,
    type,
    default: defaultValue,
    task,
  }: OptionParams) {
    this.name = name;
    this.short = short;
    this.help = help;
    this.type = type;
    this.default = defaultValue;
    this.task = task;
  }
}
