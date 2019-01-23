import chalk from "chalk";
import { join, isAbsolute } from "path";
import { Task, PrintConfigTaskParams } from "../interfaces";

class Run {
  entries: string[];

  resolved: string[];

  stablercFiles: string[];

  verbose: boolean;

  format: string;

  constructor({
    "output-format": format,
    "working-directory": cwd,
    rest: entries,
    verbose,
  }: PrintConfigTaskParams) {
    const resolved = entries.map(entry =>
      isAbsolute(entry) ? entry : join(cwd, entry),
    );
    const stablercFiles = resolved.map(dir => join(dir, ".stablerc"));

    this.entries = entries;
    this.resolved = resolved;
    this.stablercFiles = stablercFiles;
    this.verbose = verbose;
    this.format = format;
  }

  async go() {
    if (this.verbose) {
      console.log(`${chalk.bold("entries:")} ${this.entries}`);
      console.log(`${chalk.bold("resolved:")} ${this.resolved}`);
      console.log(`${chalk.bold("stablerc files:")} ${this.stablercFiles}`);
      console.log(`${chalk.bold("output format:")} ${this.format}`);
    }
  }
}

export class PrintConfigTask implements Task {
  async run(params: PrintConfigTaskParams): Promise<void> {
    await new Run(params).go();
  }
}
