import { promisify } from "util";
import { stat as coreStat } from "fs";

export const stat = promisify(coreStat);
