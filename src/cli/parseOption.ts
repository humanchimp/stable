import { Option, OptionParse } from "./interfaces";
import { OptionType } from "./enums";
import { parseOptionValue } from "./parseOptionValue";

export function parseOption(option: Option, arg: string): OptionParse {
  const { name, type } = option;
  const isBoolean = type === OptionType.BOOLEAN;
  const hasValue = isBoolean || arg.includes("=");
  const [, value = isBoolean ? "true" : undefined] = arg.split("=");

  return {
    name,
    option,
    hasValue,
    splat: hasValue
      ? value
          .split(",")
          .map(v =>
            isBoolean && /^--no-/.test(arg)
              ? !parseOptionValue(option, v)
              : parseOptionValue(option, v),
          )
      : [],
  };
}
