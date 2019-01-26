export enum CliArgKey {
  FILTER = "filter",
  GREP = "grep",
  RUNNER = "runner",
  OUTPUT_FORMAT = "output-format",
  WORKING_DIRECTORY = "working-directory",
  READ_STDIN = "read-stdin",
  QUIET = "quiet",
  VERBOSE = "verbose",
  ORDERED = "ordered",
  SORT = "sort",
  HELP = "help",
  ROLLUP = "rollup",
  SEED = "seed",
  PARTITIONS = "partitions",
  PARTITION = "partition",
  PORT = "port",
  HIDE_SKIPS = "hide-skips",
  COVERAGE = "coverage",
  REST = "rest",
}

export enum OptionType {
  BOOLEAN = "boolean",
  STRING = "string",
  NUMBER = "number",
  STRING_OR_BOOLEAN = "string or boolean",
}

export enum ConfigOutputFormat {
  YAML = "yaml",
  JSON = "json",
  INSPECT = "inspect",
}

export enum StablercDetectionType {
  INCLUDE = "include",
  EXCLUDE = "exclude",
  EXTENDS = "extends",
}
