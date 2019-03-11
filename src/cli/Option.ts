import {
  Option as OptionInterface,
  OptionParams,
  OptionSampler,
  OptionExpander,
  Menu,
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

  expander: OptionExpander;

  constructor({
    name,
    short,
    help,
    type,
    command,
    sample,
    default: defaultValue,
    expand,
  }: OptionParams) {
    this.name = name;
    this.short = short;
    this.help = help;
    this.type = type;
    this.command = command;
    this.sample = sample;
    this.default = defaultValue;
    this.expander = expand;
  }

  *expand(value: any, menu: Menu): IterableIterator<[CliArgKey, any]> {
    if (this.expander != null) {
      yield* this.expander(value, this, menu);
    }
  }
}
