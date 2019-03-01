import { join, isAbsolute, dirname } from "path";
import chalk from "chalk";
import { highlight } from "cli-highlight";
import { safeDump } from "js-yaml";
import { Stats } from "fs";
import {
  Task,
  PrintConfigTaskParams,
  LogEffect,
  StablercMatch,
} from "../../interfaces";
import { uniq } from "../uniq";
import { stat } from "fs-extra";
import { ConfigOutputFormat } from "../../enums";
import { nearestStablerc } from "../stablerc/nearestStablerc";
import { stablercsForParams } from "../stablerc/stablercsForParams";

class Run {
  private entries: string[];

  private resolved: string[];

  private stablercFiles: Promise<string[]>;

  private stablercs: Promise<Map<string, StablercMatch>>;

  private verbose: boolean;

  private format: string;

  private log: LogEffect;

  constructor(params: PrintConfigTaskParams) {
    const {
      "output-format": format = ConfigOutputFormat.YAML,
      "working-directory": cwd = process.cwd(),
      rest: entries,
      verbose,
      log = console.log, // eslint-disable-line
    } = params;
    this.entries = entries.length === 0 ? ["."] : entries;
    this.resolved = this.entries.map(entry =>
      isAbsolute(entry) ? entry : join(cwd, entry),
    );
    this.stablercFiles = this.computeStablercFiles();
    this.stablercs = stablercsForParams(params); //this.computeStablercs();
    this.verbose = verbose;
    this.format = format;
    this.log = log;
  }

  dump(document) {
    switch (this.format) {
      case ConfigOutputFormat.YAML:
        return highlight(safeDump(document), {
          language: "yaml",
        });
      case ConfigOutputFormat.JSON:
        return highlight(JSON.stringify(document, null, 2), {
          language: "json",
        });
      case ConfigOutputFormat.INSPECT:
        return document;
    }
    throw new TypeError(`unknown format: ${this.format}`);
  }

  async go() {
    if (this.verbose) {
      this.log(`${chalk.bold("entries:")} ${this.entries}`);
      this.log(`${chalk.bold("resolved:")} ${this.resolved}`);
      this.log(`${chalk.bold("stablerc files:")} ${await this.stablercFiles}`);
      this.log(`${chalk.bold("stablercs:")}`, await this.stablercs);
      this.log(`${chalk.bold("output format:")} ${this.format}`);
    }

    this.log(this.dump(this.dumpMap(await this.stablercs)));
  }

  private async computeStablercFiles(): Promise<string[]> {
    return Promise.all(
      uniq(await directoriesFor(this.resolved)).map((dir: string) =>
        nearestStablerc(dir),
      ),
    );
  }

  private dumpMap(spec) {
    return [...spec.entries()].map(
      ([
        filename,
        {
          config: { document: config },
          files,
        },
      ]) => ({
        filename,
        config,
        files,
      }),
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
