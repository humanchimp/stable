import minimist from "minimist";
import {
  Menu as MenuInterface,
  MenuParams,
  Command,
  Option,
} from "./interfaces";

export class Menu implements MenuInterface {
  commands: Map<string, Command>;

  options: Map<string, Option>;

  constructor({ commands, options }: MenuParams) {
    this.commands = this.makeMap<Command>(commands);
    this.options = this.makeMap<Option>(options);
  }

  findCommand(command: string): Command {
    return this.commands.get(command);
  }

  defaultCommand(): Command {
    return [...this.commands.values()].find(cmd => cmd.default);
  }

  parseCommandCandidate(argv): string {
    return argv[2];
  }

  parseOptions(argv: string[], command: Command) {
    const alias = this.getAliases();
    const flags = minimist(argv, { alias });
    const {
      _: [, , , ...rest], // This is gonna be way too naive...
    } = flags;
    const shorthand = new Set<string>(Object.keys(alias));

    return [...command.args].reduce(
      (memo, flag) => {
        if (shorthand.has(flag)) {
          return memo;
        }
        if (flag in flags) {
          memo[flag] = flags[flag];
        } else {
          const option = this.options.get(flag);

          if ("default" in option) {
            memo[flag] = option.default;
          }
        }
        return memo;
      },
      { rest },
    );
  }

  async selectFromArgv(argv: string[]): Promise<void> {
    const commandCandidate = this.parseCommandCandidate(argv);
    const command = this.findCommand(commandCandidate) || this.defaultCommand();
    const options = this.parseOptions(argv, command);

    // the task belonging to any option will run instead of the command's task, because
    // options are finer-grained than commands. Concretely, `$ stable run -h` is equivalent
    // to running `$ stable help`, and doesn't invoke `$ stable run` machinery at all.
    let task;

    for (const { task: t, name } of this.options.values()) {
      if (name in options && t != null) {
        task = t;
      }
    }
    await (task != null
      ? task.run(options, null, this)
      : command.run(options, this));
  }

  private getAliases() {
    return [...this.options.values()]
      .filter(option => option.short != null)
      .reduce((memo, { short, name }) => {
        memo[short] = name;
        return memo;
      }, {});
  }

  private makeMap<T>(list): Map<string, T> {
    return new Map(list.map(t => [t.name, t] as [string, T]));
  }
}
