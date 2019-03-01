import {
  Option as OptionInterface,
  OptionParams,
  Task,
  OptionSampler,
} from "../interfaces";
import { OptionType } from "../enums";

export class Option implements OptionInterface {
  name: string;

  short: string;

  help: string;

  type: OptionType;

  default: any;

  task: Task;

  sample: OptionSampler;

  constructor({
    name,
    short,
    help,
    type,
    default: defaultValue,
    task,
    sample,
  }: OptionParams) {
    this.name = name;
    this.short = short;
    this.help = help;
    this.type = type;
    this.task = task;
    this.sample = sample;
    this.default = defaultValue;
  }
}
