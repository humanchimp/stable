import { CliArgKey, OptionType, CliCommandKey } from "../enums";
import { Menu } from "./Menu";
import { Command } from "./Command";
import { Option } from "./Option";

export const cli = new Menu({
  debug: true,
  commands: [
    new Command({
      name: CliCommandKey.RUN,
      emoji: "🐎",
      help: `If files are passed, start there, find .stablercs. If no files passed, start with the .stablerc in the pwd. Run every suite we find with the correct .stablerc.`,
      args: [
        CliArgKey.RUNNER,
        CliArgKey.FORCE,
        CliArgKey.PARTITION,
        CliArgKey.PARTITIONS,
        CliArgKey.FILTER,
        CliArgKey.GREP,
        CliArgKey.ORDERED,
        CliArgKey.SORT,
        CliArgKey.OUTPUT_FORMAT,
        CliArgKey.PORT,
        CliArgKey.COVERAGE,
        CliArgKey.HIDE_SKIPS,
        CliArgKey.FAIL_FAST,
        CliArgKey.HEADFUL,
        CliArgKey.VERBOSE,
        CliArgKey.QUIET,
      ],
      default: true,
    }),
    new Command({
      name: CliCommandKey.BUNDLE,
      emoji: "📦",
      help: `Produce bundle artifacts, but don't run any tests.`,
      args: [
        CliArgKey.PARTITION,
        CliArgKey.PARTITIONS,
        CliArgKey.OUTPUT_FORMAT,
        CliArgKey.ROLLUP,
        CliArgKey.ONREADY,
        CliArgKey.COVERAGE,
        CliArgKey.HIDE_SKIPS,
        CliArgKey.VERBOSE,
        CliArgKey.QUIET,
      ],
    }),
    new Command({
      name: CliCommandKey.CONFIG,
      emoji: "⚙️",
      help: `Print the config to stdout after performing the algorithm to load it relative to the given path, else the pwd. Stream the reports to stdout`,
      args: [
        CliArgKey.OUTPUT_FORMAT,
        CliArgKey.WORKING_DIRECTORY,
        CliArgKey.VERBOSE,
      ],
    }),
    new Command({
      name: CliCommandKey.HELP,
      emoji: "🙃",
      help: `Print this message.`,
      args: [],
    }),
  ],
  options: [
    new Option({
      name: CliArgKey.READ_STDIN,
      help: "read stdin.",
      type: OptionType.BOOLEAN,
      default: false,
    }),
    new Option({
      name: CliArgKey.FILTER,
      short: "f",
      help: "a substring match to filter by suite description.",
      type: OptionType.STRING,
    }),
    new Option({
      name: CliArgKey.GREP,
      short: "g",
      help:
        "a JavaScript regular expression to use for filtering by suite description.",
      type: OptionType.STRING,
    }),
    new Option({
      name: CliArgKey.RUNNER,
      short: "r",
      help: "the runner to use.",
      type: OptionType.STRING,
    }),
    new Option({
      name: CliArgKey.FORCE,
      help:
        "force the use of the specified runner even against conflicting directives",
      type: OptionType.BOOLEAN,
    }),
    new Option({
      name: CliArgKey.OUTPUT_FORMAT,
      short: "o",
      help: "the format of the output stream.",
      type: OptionType.STRING,
    }),
    new Option({
      name: CliArgKey.SORT,
      help:
        "the sort algorithm used when visiting the specs. By default, specs are shuffled using the Fisher-Yates algorithm. You can defeat this feature by passing --sort=ordered.",
      type: OptionType.STRING,
      default: "shuffle",
    }),
    new Option({
      name: CliArgKey.ORDERED,
      help: "a convenient shorthand for --sort=ordered.",
      type: OptionType.BOOLEAN,
      default: undefined,
    }),
    new Option({
      name: CliArgKey.PARTITIONS,
      help: "the total of partitions to divide the specs by.",
      type: OptionType.NUMBER,
      default: undefined,
    }),
    new Option({
      name: CliArgKey.PARTITION,
      help: "the partition to run and report.",
      type: OptionType.NUMBER,
      default: undefined,
    }),
    new Option({
      name: CliArgKey.SEED,
      help:
        "for seeding the random number generator used by the built-in shuffle algorithm.",
      type: OptionType.STRING,
      default: undefined,
    }),
    new Option({
      name: CliArgKey.ROLLUP,
      help: "path to the rollup config for your project.",
      type: OptionType.STRING,
      default: "rollup.config.js",
    }),
    new Option({
      name: CliArgKey.ONREADY,
      help: 'the name of a function to call when "ready".',
      type: OptionType.STRING,
      default: "run",
    }),
    new Option({
      name: CliArgKey.BUNDLE_FILE,
      help:
        "the name of the file of the output bundle. if we end up with multiple bundles, we'll start numbering them",
      type: OptionType.STRING,
      default: "bundle.js",
    }),
    new Option({
      name: CliArgKey.BUNDLE_FORMAT,
      help: "the format of the outpout bundle",
      type: OptionType.STRING,
      default: "iife",
    }),
    new Option({
      name: CliArgKey.COVERAGE,
      help: "unclear what function this serves at this point",
      type: OptionType.STRING_OR_BOOLEAN,
      default: process.env.NYC_PARENT_PID ? "lcov" : false,
    }),
    new Option({
      name: CliArgKey.HIDE_SKIPS,
      help: "hide skipped specs from the stream.",
      type: OptionType.STRING_OR_BOOLEAN,
      default: "focus",
    }),
    new Option({
      name: CliArgKey.FAIL_FAST,
      help: "exit immediately when something is not ok",
      type: OptionType.BOOLEAN,
      default: true,
    }),
    new Option({
      name: CliArgKey.PORT,
      help: "the port to listen on whenever stable needs an http server.",
      type: OptionType.NUMBER,
      default: 10001,
    }),
    new Option({
      name: CliArgKey.HEADFUL,
      help: "run the user agent headfully",
      type: OptionType.BOOLEAN,
      default: false,
    }),
    new Option({
      name: CliArgKey.VERBOSE,
      short: "v",
      help: "be chattier.",
      type: OptionType.BOOLEAN,
      default: false,
    }),
    new Option({
      name: CliArgKey.QUIET,
      short: "q",
      help: "don't send an exit code on failure.",
      type: OptionType.BOOLEAN,
      default: false,
    }),
    new Option({
      name: CliArgKey.WORKING_DIRECTORY,
      help: "a path to use instead of the pwd.",
      type: OptionType.STRING,
      default: process.cwd(),
    }),
    new Option({
      name: CliArgKey.HELP,
      short: "h",
      help: "print this message.",
      type: OptionType.BOOLEAN,
      default: false,
      command: "help",
    }),
  ],
});
