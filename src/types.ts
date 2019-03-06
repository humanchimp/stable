import { CliArgKey } from "./enums";
import {
  Plan,
  Report,
  Summary,
  CoverageMessage,
  ConsoleMessage,
  EndSignal,
} from "./interfaces";

export type CliArgs = { [P in CliArgKey]?: any[] };

export type Splat<T> = T | T[];

export type StablercPluginDefinition = [string, any];

export type Message =
  | Plan
  | Report
  | Summary
  | CoverageMessage
  | ConsoleMessage
  | EndSignal;
