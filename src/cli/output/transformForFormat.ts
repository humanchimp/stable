import { inspect } from "util";
import { tapTransform } from "./tapTransform";

export function transformForFormat(format) {
  switch (format) {
    case "inspect":
      return it => inspect(it, { colors: true });
    case "json":
    case "jsonlines":
      return JSON.stringify;
    case "tap":
      return tapTransform();
  }
  throw new Error(`unsupported format: -f ${format}`);
}
