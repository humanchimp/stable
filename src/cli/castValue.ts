import { OptionType } from "./enums";

export function castValue(value, type): boolean | string | number {
  switch (type) {
    case OptionType.STRING:
      return String(value);
    case OptionType.BOOLEAN:
      return toBoolean(value);
    case OptionType.NUMBER:
      return parseFloat(value);
    case OptionType.STRING_OR_BOOLEAN: {
      if (isBoolish(value)) {
        return toBoolean(value);
      }
      return String(value);
    }
  }
  throw new TypeError(`cannot cast to "${type}"!`);
}

export function isBoolish(value) {
  switch (value) {
    case "true":
    case "yes":
    case "on":
    case "1":
    case "false":
    case "no":
    case "off":
    case "0":
    case "":
      return true;
  }
}

export function toBoolean(value) {
  switch (value) {
    case "true":
    case "yes":
    case "on":
    case "1":
      return true;
  }
  return false;
}
