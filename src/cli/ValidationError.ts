import { Command, CommandParse } from "../interfaces";
import { CliArgs } from "../types";

export class ValidationError extends Error {
  command: Command;

  options: CliArgs;

  rest: string[];

  invalid: string[];

  isDefault: boolean;

  constructor(
    message,
    { command, options, rest, invalid, isDefault }: CommandParse,
  ) {
    super(message);
    this.command = command;
    this.options = options;
    this.rest = rest;
    this.invalid = invalid;
    this.isDefault = isDefault;
  }
}
