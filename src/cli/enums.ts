export enum CliArgKey {
  FILTER = "filter",
  GREP = "grep",
  RUNNER = "runner",
  OUTPUT_FORMAT = "output-format",
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
}

export enum OptionType {
  boolean = "boolean",
  string = "string",
  number = "number",
  stringOrBoolean = "string or boolean",
}
