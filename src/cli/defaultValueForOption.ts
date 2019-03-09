import { CliArgKey } from "../enums";
import { cli } from "./cli";

export function defaultValueForOption(optionName: CliArgKey, value: any): any {
  const option = cli.options.get(optionName);

  return option === undefined
    ? value
    : value === undefined
    ? option.default
    : value;
}
