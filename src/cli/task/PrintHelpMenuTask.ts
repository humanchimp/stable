// import * as chalk from "chalk";
import { Task, Menu, Command } from "../interfaces";

export class PrintHelpMenuTask implements Task {
  //   static color([help]: TemplateStringsArray) {
  //     return help
  //       .replace(/(\[[^\]]+\])/g, (_, type) => chalk.green(type))
  //       .replace(/(--?[a-z=]+)/g, (_, option) => chalk.blue(option));
  //   }
  private static printCommands(commands) {
    return [...commands.entries()]
      .map(
        ([command, { help }]) => `\n${command}\t${help}\n`,
      )
      .join("\n");
  }

  private static printOptions(options) {
    return [...options.values()]
      .map(({ short, name, help }) => `\n${[short != null && `-${short}`, `--${name}`].filter(Boolean).join(", ")}\t${help}\n`)
      .join("\n");
  }

  run(parsed: any, command: Command, menu: Menu): void {
    console.log(/*PrintHelpMenuTask.color*/ `
Usage: 🐎 stable [command] [glob]

${PrintHelpMenuTask.printCommands(menu.commands)}

Options:

${PrintHelpMenuTask.printOptions(menu.options)}
`);
  }
}
