import { CliArgKey } from "./enums";

export type CliArgs = { [P in CliArgKey]?: any };
