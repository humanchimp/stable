import { CliArgKey } from "./enums";

export type CliArgs = { [P in CliArgKey]?: any[] };

export type Splat<T> = T | T[];

export type StablercPluginDefinition = [string, any];
