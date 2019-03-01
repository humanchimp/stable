import { Option, OptionParse } from "../interfaces";
import { OptionType } from "./enums";
import { parseOptionValue } from "./parseOptionValue";

export function parseOption(option: Option, arg: string): OptionParse {
  const { name, type } = option;
  const isBoolean = type === OptionType.BOOLEAN;
  const negated = isBoolean && /^--no-/.test(arg);
  const hasValue = negated || arg.includes("=");
  const [, value = negated ? "off" : undefined] = arg.split("=");

  return {
    name,
    option,
    hasValue,
    negated,
    splat: hasValue
      ? value.split(",").map(v => parseOptionValue(option, v))
      : [],
  };
}
