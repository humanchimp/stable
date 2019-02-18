import { castValue } from "./castValue";
import { Option } from "./interfaces";

export function parseOptionValue(
  option: Option,
  value: string,
): string | boolean | number {
  return castValue(value, option.type);
}
