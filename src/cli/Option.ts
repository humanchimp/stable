import {
  Option as OptionInterface,
  OptionParams,
  OptionSampler,
} from "../interfaces";
import { OptionType, CliCommandKey, CliArgKey } from "../enums";

export class Option implements OptionInterface {
  name: CliArgKey;

  short: string;

  help: string;

  type: OptionType;

  default: any;

  command: CliCommandKey;

  sample: OptionSampler;

  constructor({
    name,
    short,
    help,
    type,
    default: defaultValue,
    command,
    sample,
  }: OptionParams) {
    this.name = name;
    this.short = short;
    this.help = help;
    this.type = type;
    this.command = command;
    this.sample = sample;
    this.default = defaultValue;
  }
}
