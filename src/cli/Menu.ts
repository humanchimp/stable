import {
  Menu as MenuInterface,
  MenuParams,
  Command,
  Option,
  CommandParse,
  Task,
} from "../interfaces";
import { Command as SimpleCommand, toleratedArgs } from "./Command";
import { kebab } from "./case/kebab";
import { OptionType, CliArgKey, CliCommandKey } from "../enums";
import { ValidationError } from "./ValidationError";
import { parseOption } from "./parseOption";
import { parseOptionValue } from "./parseOptionValue";
import { CliArgs } from "../types";

export class Menu implements MenuInterface {
  commands: Map<CliCommandKey, Command>;

  options: Map<CliArgKey, Option>;

  debug: boolean;

  constructor({ commands, options, debug = false }: MenuParams) {
    this.commands = this.makeMap<CliCommandKey, Command>(commands);
    this.options = this.makeMap<CliArgKey, Option>(options);
    this.debug = debug;

    if (debug && !this.commands.has(CliCommandKey.PARSE_OPTIONS)) {
      this.commands.set(
        CliCommandKey.PARSE_OPTIONS,
        new SimpleCommand({
          name: CliCommandKey.PARSE_OPTIONS,
          emoji: "🥢",
          help: "Parse argv; print result",
          args: [...this.options.keys()] as CliArgKey[],
        }),
      );
    }
  }

  defaultCommand(): Command {
    const command = [...this.commands.values()].find(cmd => cmd.default);

    if (command == null) {
      throw new TypeError("no default command");
    }
    return command;
  }

  commandFromArgv(argv: string[]): CommandParse {
    const options = Object.create(null);
    const invalid = [];
    const rest = [];

    let currentOption: Option;
    let command: Command;

    for (const arg of argv) {
      if (currentOption != null) {
        if (!arg.startsWith("-")) {
          options[currentOption.name] = arg
            .split(",")
            .map(v => parseOptionValue(currentOption, v));
          currentOption = undefined;
          continue;
        }
        currentOption = undefined;
      }
      if (command == null) {
        const cmd = this.detectCommand(arg);

        if (cmd != null) {
          command = cmd;
          continue;
        }
      }
      if (arg.startsWith("--") || arg.startsWith("-")) {
        const option = this.detectOption(arg.split("=")[0]);

        if (option == null) {
          if (arg.startsWith("--")) {
            invalid.push(arg);
            continue;
          }
          // fallthrough!!!
        } else {
          const { name, splat, hasValue } = parseOption(option, arg);

          if (options[name] == null) {
            options[name] = [];
          }
          if (hasValue) {
            options[name].push(...splat);
          } else {
            currentOption = option;
          }
          continue;
        }
      }
      if (arg.startsWith("-") && !arg.startsWith("--")) {
        const { lastValid } = arg
          .slice(1)
          .split("")
          .reduce(
            (memo, f) => {
              const flag = `-${f}`;
              const option = this.detectOption(flag);

              if (option == null) {
                memo.lastValid = undefined;
                invalid.push(flag);
              } else if (option.type === OptionType.BOOLEAN) {
                if (options[option.name] == null) {
                  options[option.name] = [];
                }
                options[option.name].push(true);
              }
              memo.lastValid = option;
              return memo;
            },
            { lastValid: undefined },
          );

        currentOption = lastValid != null ? lastValid : undefined;
        continue;
      }
      rest.push(arg);
    }
    if (currentOption != null) {
      if (options[currentOption.name] == null) {
        options[currentOption.name] = [];
      }
      switch (currentOption.type) {
        case OptionType.STRING_OR_BOOLEAN:
        case OptionType.BOOLEAN: {
          options[currentOption.name].push(true);
          break;
        }
        case OptionType.STRING: {
          options[currentOption.name].push("");
          break;
        }
        case OptionType.NUMBER: {
          options[currentOption.name].push(0);
        }
      }
      currentOption = undefined;
    }

    const isDefault = command == null;
    const selectedCommand = isDefault ? this.defaultCommand() : command;

    return {
      command: selectedCommand,
      isDefault,
      options: this.compileOptions(options, selectedCommand),
      invalid,
      rest,
    };
  }

  async runFromArgv(argv: string[], tasks: Map<string, Task>): Promise<void> {
    const parsed = this.commandFromArgv(argv.slice(2));
    const { options, rest, invalid } = parsed;
    let { command }: { command: Command } = parsed;

    if (invalid.length > 0) {
      throw new ValidationError(
        `unintelligible arguments: ${invalid.join(", ")}`,
        parsed,
      );
    }
    // the task belonging to any option will run instead of the command's task, because
    // options are finer-grained than commands. Concretely, `$ stable run -h` is equivalent
    // to running `$ stable help`, and doesn't invoke `$ stable run` machinery at all.
    for (const { command: commandName, name } of this.options.values()) {
      if (options[name] && commandName != null) {
        command = this.commands.get(commandName);
      }
    }

    const mashup = {
      // user-defined options
      ...options,

      // user-defined positional parameters (excluding invalid options)
      rest,
    };

    await command.validateOptions(options);
    await tasks.get(command.name).run(mashup, command, this);
  }

  private compileOptions(options: CliArgs, command: Command): CliArgs {
    const flat: CliArgs = {};

    for (const optionName of [...command.args, ...toleratedArgs]) {
      const option = this.options.get(optionName);
      const splat = [].concat(options[optionName] || []);
      let sample: any;
      let defaultValue: any;

      if (option != null) {
        // In this case we have an "explicit" option (not a merely tolarated one)
        defaultValue = option.default;
        sample =
          option.sample != null
            ? option.sample(splat)
            : splat[splat.length - 1];

        const value = sample === undefined ? defaultValue : sample;

        flat[optionName] = value;

        for (const [expanedOptionName, expandedValue] of option.expand(
          value,
          this,
        )) {
          flat[expanedOptionName] = expandedValue;
        }
      }
    }
    return flat;
  }

  private detectCommand(arg: string): Command {
    return this.commands.get(kebab(arg) as CliCommandKey);
  }

  private detectOption(arg: string): Option {
    const [, stripped] = arg.match(/^--?(?:no-)?(.*)/);
    const candidate =
      this.options.get(stripped as CliArgKey) ||
      this.options.get(this.getAliases()[stripped]);

    return candidate == null
      ? undefined
      : arg.startsWith("--no-")
      ? [OptionType.BOOLEAN, OptionType.STRING_OR_BOOLEAN].includes(
          candidate.type,
        )
        ? candidate
        : undefined
      : candidate;
  }

  private getAliases(): {} {
    return [...this.options.values()]
      .filter(option => option.short != null)
      .reduce((memo, { short, name }) => {
        memo[short] = name;
        return memo;
      }, {});
  }

  private makeMap<T, T2 extends { name: T }>(list: T2[]): Map<T, T2> {
    return new Map(list.map(t => [kebab(`${t.name}`) as any, t] as [T, T2]));
  }
}
