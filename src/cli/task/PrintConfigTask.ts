import { join, isAbsolute, dirname } from "path";
import chalk from "chalk";
import { highlight } from "cli-highlight";
import { safeDump } from "js-yaml";
import { Stats } from "fs";
import { Task, PrintConfigTaskParams, LogEffect } from "../interfaces";
import { uniq } from "../uniq";
import { stat } from "../stat";
import { StablercFile } from "../stablerc/StablercFile";
import { StablercChain } from "../stablerc/StablercChain";
import { ConfigOutputFormat } from "../enums";
import { nearestStablerc } from "../stablerc/nearestStablerc";
import { loadSpecMap } from "../stablerc/loadSpecMap";
import { loadStablercMap } from "../stablerc/loadStablercMap";

class Run {
  private entries: string[];

  private resolved: string[];

  private bySpec: boolean;

  private stablercFiles: Promise<string[]>;

  private stablercs: Promise<Map<string, StablercFile>[]>;

  private verbose: boolean;

  private format: string;

  private log: LogEffect;

  constructor({
    "output-format": format = ConfigOutputFormat.YAML,
    "working-directory": cwd = process.cwd(),
    "list-by-spec": bySpec = false,
    rest: entries,
    verbose,
    log = console.log,
  }: PrintConfigTaskParams) {
    this.entries = entries.length === 0 ? ["."] : entries;
    this.bySpec = bySpec;
    this.resolved = this.entries.map(entry =>
      isAbsolute(entry) ? entry : join(cwd, entry),
    );
    this.stablercFiles = this.computeStablercFiles();
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

  private async computeStablercs(): Promise<Map<string, StablercFile>[]> {
    return Promise.all(
      (await this.stablercFiles).map(async filename => {
        const chains = await StablercChain.loadAll(filename, {
          plugins: true,
        });

        return this.bySpec
          ? await loadSpecMap(chains, filename)
          : loadStablercMap(chains);
      }),
    );
  }

  private dumpMap(spec) {
    return [...spec.entries()].map(([filename, { document }]) => ({
      filename,
      config: document,
    }));
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
