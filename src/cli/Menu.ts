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

  findCommand(command) {
    return this.commands.get(command);
  }

  defaultCommand() {
    return [...this.commands.values()].find(cmd => cmd.default);
  }

  parseOptions(argv) {
    const alias = this.getAliases();
    const options = minimist(argv, { alias });
    const {
      _: [, , commandCandidate],
    } = options;
    const shorthand = new Set<string>(Object.keys(alias));

    return {
      commandCandidate,
      options: Object.keys(options).reduce((memo, option) => {
        if (!shorthand.has(option)) {
          memo[option] = options[option];
        }
        return memo;
      }, {}),
    };
  }

  async selectFromArgv(argv: string[]): Promise<void> {
    const { commandCandidate, options } = this.parseOptions(argv);
    const command = this.findCommand(commandCandidate) || this.defaultCommand();

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
