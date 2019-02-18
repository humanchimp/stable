import chalk from "chalk";
import { Task, Menu, Command } from "../interfaces";

export class PrintHelpMenuTask implements Task {
  private static printCommands(commands) {
    const values = [...commands.values()];

    return values
      .map(
        ({ name, emoji, help }) => `${emoji} ${chalk.cyan(name)}\n\n${help}\n`,
      )
      .join("\n");
  }

  private static printOption(name, short) {
    return [short != null && `-${short}`, `--${name}`]
      .filter(Boolean)
      .join(", ");
  }

  private static printOptions(options) {
    const values = [...options.values()];
    const definitions = values.map(({ name, short }) =>
      PrintHelpMenuTask.printOption(name, short),
    );
    const max = definitions
      .map(it => it.length)
      .reduce((a, b) => Math.max(a, b), 0);

    return values
      .map(
        ({ help, type, default: defaultValue }, index) =>
          `${chalk.blue(definitions[index].padEnd(max))}\t${help} ${chalk.green(
            `[${type}]`,
          )}${
            defaultValue != null
              ? chalk.green(` [default: ${defaultValue}]`)
              : ""
          }`,
      )
      .join("\n");
  }

  run(options: any, command: Command, menu: Menu): void {
    /* eslint-disable no-console */
    console.log(`Usage: ${chalk.bold("stable")} ${chalk.green(
      `<${[...menu.commands.keys()].join(" ")}> <file(s)/dir(s)> [options]`,
    )}

${PrintHelpMenuTask.printCommands(menu.commands)}
Options:

${PrintHelpMenuTask.printOptions(menu.options)}
`);
    /* eslint-enable no-console */
  }
}
