import { join, isAbsolute, dirname, relative } from "path";
import chalk from "chalk";
import { highlight } from "cli-highlight";
import { safeDump } from "js-yaml";
import { Stats } from "fs";
import { Task, PrintConfigTaskParams, LogEffect } from "../interfaces";
import { uniq } from "../uniq";
import { stat } from "../stat";
import { StablercChain } from "../stablerc/StablercChain";
import { StablercFile } from "../stablerc/StablercFile";
import { ConfigOutputFormat } from "../enums";
import { nearestStablerc } from "../stablerc/nearestStablerc";
import { loadMap } from "../stablerc/loadMap";

class Run {
  entries: string[];

  resolved: string[];

  private cwd: string;

  private stablercFiles: Promise<string[]>;

  private stablercChains: Promise<Map<string, StablercChain>[]>;

  private stablercs: Promise<Map<string, StablercFile>[]>;

  verbose: boolean;

  format: string;

  private log: LogEffect;

  constructor({
    "output-format": format,
    "working-directory": cwd,
    rest: entries,
    verbose,
    log = console.log,
  }: PrintConfigTaskParams) {
    this.cwd = cwd;
    this.entries = entries;
    this.resolved = entries.map(entry =>
      isAbsolute(entry) ? entry : join(cwd, entry),
    );
    this.stablercFiles = this.computeStablercFiles();
    this.stablercChains = this.computeStablercChains();
    this.stablercs = this.computeStablercs();
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
      this.log(`${chalk.bold("stablerc chains:")}`, await this.stablercChains);
      this.log(`${chalk.bold("stablercs:")}`, await this.stablercs);
      this.log(`${chalk.bold("output format:")} ${this.format}`);
    }

    const stablercs = await this.stablercs;

    for (const stablerc of stablercs) {
      this.log(this.dump(this.dumpMap(stablerc)));
    }
  }

  private async computeStablercFiles(): Promise<string[]> {
    return Promise.all(
      uniq(await directoriesFor(this.resolved)).map((dir: string) =>
        nearestStablerc(dir),
      ),
    );
  }

  private async computeStablercChains(): Promise<Map<string, StablercChain>[]> {
    return Promise.all(
      (await this.stablercFiles).map(filename =>
        loadMap(filename, { plugins: true }),
      ),
    );
  }

  private async computeStablercs(): Promise<Map<string, StablercFile>[]> {
    return (await this.stablercChains).map(
      map =>
        new Map(
          [...map.entries()].map(
            ([filename, chain]) =>
              [filename, chain.flat()] as [string, StablercFile],
          ),
        ),
    );
  }

  private dumpMap(spec) {
    return [...spec.entries()].reduce((memo, [filename, { document }]) => {
      memo[relative(this.cwd, filename)] = document;
      return memo;
    }, Object.create(null));
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
