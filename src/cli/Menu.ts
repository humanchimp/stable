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
    const options = minimist(argv, { alias: this.getAliases() });
    const {
      _: [, , commandCandidate],
    } = options;

    return {
      commandCandidate,
      options,
    };
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

  async selectFromArgv(argv: string[]) {
    const { commandCandidate, options } = this.parseOptions(argv);
    const command = this.findCommand(commandCandidate) || this.defaultCommand();

    await command.run(options, this);
  }
}
