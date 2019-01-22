import { CliArgKey, OptionType } from "./enums";
import { Menu } from "./Menu";
import { Command } from "./Command";
import { Option } from "./Option";
import { PrintHelpMenuTask } from "./task/PrintHelpMenuTask";
import { PrintConfigTask } from "./task/PrintConfigTask";
import { BundleTask } from "./task/BundleTask";
import { RunTask } from "./task/RunTask";

export const cli = new Menu({
  commands: [
    new Command({
      name: "run",
      help: "run the test suite using a runner.",
      args: [
        CliArgKey.PARTITION,
        CliArgKey.PARTITIONS,
        CliArgKey.OUTPUT_FORMAT,
        CliArgKey.COVERAGE,
        CliArgKey.HIDE_SKIPS,
        CliArgKey.VERBOSE,
        CliArgKey.QUIET,
      ],
      task: new RunTask(),
      default: true,
    }),
    new Command({
      name: "bundle",
      help: "bundle the test suite modules.",
      args: [
        CliArgKey.PARTITION,
        CliArgKey.PARTITIONS,
        CliArgKey.OUTPUT_FORMAT,
        CliArgKey.COVERAGE,
        CliArgKey.HIDE_SKIPS,
        CliArgKey.VERBOSE,
        CliArgKey.QUIET,
      ],
      task: new BundleTask(),
    }),
    new Command({
      name: "config",
      help:
        "perform the algorithm to generate the config relative to the given path, else the pwd.",
      args: [CliArgKey.OUTPUT_FORMAT],
      task: new PrintConfigTask(),
    }),
    new Command({
      name: "help",
      help: "print this message.",
      args: [],
      task: new PrintHelpMenuTask(),
    }),
  ],
  options: [
    new Option({
      name: CliArgKey.READ_STDIN,
      help: "read stdin.",
      type: OptionType.boolean,
      default: false,
    }),
    new Option({
      name: CliArgKey.FILTER,
      short: "f",
      help: "a substring match to filter by suite description.",
      type: OptionType.string,
    }),
    new Option({
      name: CliArgKey.GREP,
      short: "g",
      help:
        "a JavaScript regular expression to use for filtering by suite description.",
      type: OptionType.string,
    }),
    new Option({
      name: CliArgKey.RUNNER,
      short: "r",
      help: "the runner to use.",
      type: OptionType.string,
    }),
    new Option({
      name: CliArgKey.OUTPUT_FORMAT,
      short: "o",
      help: "the format of the output stream.",
      type: OptionType.string,
    }),
    new Option({
      name: CliArgKey.SORT,
      help:
        "the sort algorithm used when visiting the specs. By default, specs are shuffled using the Fisher-Yates algorithm. You can defeat this feature by passing --sort=ordered.",
      type: OptionType.string,
      default: "shuffle",
    }),
    new Option({
      name: CliArgKey.ORDERED,
      help: "a convenient shorthand for --sort=ordered.",
      type: OptionType.boolean,
      default: undefined,
    }),
    new Option({
      name: CliArgKey.PARTITIONS,
      help: "the total of partitions to divide the specs by.",
      type: OptionType.number,
      default: undefined,
    }),
    new Option({
      name: CliArgKey.PARTITION,
      help: "the partition to run and report.",
      type: OptionType.number,
      default: undefined,
    }),
    new Option({
      name: CliArgKey.SEED,
      help:
        "for seeding the random number generator used by the built-in shuffle algorithm.",
      type: OptionType.string,
      default: undefined,
    }),
    new Option({
      name: CliArgKey.ROLLUP,
      help: "path to the rollup config for your project.",
      type: OptionType.string,
      default: "rollup.config.js",
    }),
    new Option({
      name: CliArgKey.COVERAGE,
      help: "unclear what function this serves at this point",
      type: OptionType.string,
      default: "lcov",
    }),
    new Option({
      name: CliArgKey.HIDE_SKIPS,
      help: "hide skipped specs from the stream.",
      type: OptionType.stringOrBoolean,
      default: "focus",
    }),
    new Option({
      name: CliArgKey.PORT,
      help: "the port to listen on whenever stable needs an http server.",
      type: OptionType.number,
      default: 10001,
    }),
    new Option({
      name: CliArgKey.VERBOSE,
      short: "v",
      help: "be chattier.",
      type: OptionType.boolean,
      default: false,
    }),
    new Option({
      name: CliArgKey.QUIET,
      short: "q",
      help: "don't send an exit code on failure.",
      type: OptionType.boolean,
      default: false,
    }),
    new Option({
      name: CliArgKey.HELP,
      short: "h",
      help: "print this message.",
      type: OptionType.boolean,
      default: false,
      task: new PrintHelpMenuTask(),
    }),
  ],
});
