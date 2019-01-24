import chalk from "chalk";
import { join, isAbsolute, dirname } from "path";
import { stat } from "../stat";
import { uniq } from "../uniq";
import { Task, PrintConfigTaskParams } from "../interfaces";
import { Stats } from "fs";

class Run {
  entries: string[];

  resolved: string[];

  stablercFiles: Promise<string[]>;

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
    this.entries = entries;
    this.resolved = resolved;
    this.stablercFiles = this.stablercFilesFor(resolved);
    this.verbose = verbose;
    this.format = format;
  }

  async go() {
    if (this.verbose) {
      console.log(`${chalk.bold("entries:")} ${this.entries}`);
      console.log(`${chalk.bold("resolved:")} ${this.resolved}`);
      console.log(
        `${chalk.bold("stablerc files:")} ${await this.stablercFiles}`,
      );
      console.log(`${chalk.bold("output format:")} ${this.format}`);
    }
  }

  async stablercFilesFor(files) {
    return uniq(await directoriesFor(files)).map((dir: string) =>
      join(dir, ".stablerc"),
    );
  }
}

async function directoriesFor(files) {
  return (await Promise.all(
    files.map(async filename => ({
      filename,
      stats: await stat(filename),
    })),
  )).map(({ filename, stats }: { stats: Stats; filename: string }) =>
    stats.isDirectory() ? filename : dirname(filename),
  );
}

export class PrintConfigTask implements Task {
  async run(params: PrintConfigTaskParams): Promise<void> {
    await new Run(params).go();
  }
}
