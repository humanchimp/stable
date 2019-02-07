import {
  Menu as MenuInterface,
  MenuParams,
  Command,
  Option,
  CommandParse,
  Named,
} from "./interfaces";
import { Command as SimpleCommand, toleratedArgs } from "./Command";
import { kebab } from "./case/kebab";
import { OptionType, CliArgKey } from "./enums";
import { ValidationError } from "./ValidationError";
import { parseOption } from "./parseOption";
import { parseOptionValue } from "./parseOptionValue";
import { CliArgs } from "./types";

export class Menu implements MenuInterface {
  commands: Map<string, Command>;

  options: Map<string, Option>;

  debug: boolean;

  constructor({ commands, options, debug = false }: MenuParams) {
    this.commands = this.makeMap<Command>(commands);
    this.options = this.makeMap<Option>(options);
    this.debug = debug;

    if (debug && !this.commands.has("parse-options")) {
      this.commands.set(
        "parse-options",
        new SimpleCommand({
          name: "parse-options",
          emoji: "🥢",
          help: "Parse argv; print result",
          task: {
            run(options) {
              console.log(options);
            },
          },
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
      if (arg.startsWith("--") || (arg.startsWith("-") && arg.includes("="))) {
        const option = this.detectOption(arg.split("=")[0]);

        if (option == null) {
          invalid.push(arg);
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
        }
        continue;
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
      options: this.flatOptions(options, selectedCommand),
      invalid,
      rest,
    };
  }

  async runFromArgv(argv: string[]): Promise<void> {
    const parsed = this.commandFromArgv(argv.slice(2));
    const { command, options, rest, invalid } = parsed;

    if (invalid.length > 0) {
      throw new ValidationError(
        `unintelligible arguments: ${invalid.join(", ")}`,
        parsed,
      );
    }
    // the task belonging to any option will run instead of the command's task, because
    // options are finer-grained than commands. Concretely, `$ stable run -h` is equivalent
    // to running `$ stable help`, and doesn't invoke `$ stable run` machinery at all.
    let task;

    for (const { task: t, name } of this.options.values()) {
      if (options[name] && t != null) {
        task = t;
      }
    }

    const mashup = {
      // user-defined options
      ...options,

      // user-defined positional parameters (excluding invalid options)
      rest,
    };

    await (task != null
      ? task.run(mashup, null, this)
      : command.run(mashup, this));
  }

  private flatOptions(options: CliArgs, command: Command): CliArgs {
    const flat: CliArgs = {};

    for (const optionName of [...command.args, ...toleratedArgs]) {
      const option = this.options.get(optionName);
      const splat = [].concat(options[optionName] || []);
      const sample =
        option && option.sample != null ? option.sample(splat) : splat.pop();
      const value = sample === undefined ? option && option.default : sample;

      // Only create keys for undefineds for explicit args, not merely tolerated ones
      if (value !== undefined || command.args.has(optionName)) {
        flat[optionName] = value;
      }
    }
    return flat;
  }

  private detectCommand(arg: string): Command {
    return this.commands.get(kebab(arg));
  }

  private detectOption(arg: string): Option {
    const [, stripped] = arg.match(/^--?(?:no-)?(.*)/);
    const candidate =
      this.options.get(stripped) ||
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

  private makeMap<T extends Named>(list: T[]): Map<string, T> {
    return new Map(list.map(t => [kebab(t.name), t] as [string, T]));
  }
}
