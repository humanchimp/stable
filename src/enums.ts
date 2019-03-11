export enum CliArgKey {
  FILTER = "filter",
  GREP = "grep",
  RUNNER = "runner",
  FORCE = "force",
  OUTPUT_FORMAT = "output-format",
  WORKING_DIRECTORY = "working-directory",
  READ_STDIN = "read-stdin",
  QUIET = "quiet",
  VERBOSE = "verbose",
  ORDERED = "ordered",
  SORT = "sort",
  HELP = "help",
  ROLLUP = "rollup",
  ONREADY = "onready",
  BUNDLE_FILE = "bundle-file",
  BUNDLE_FORMAT = "bundle-format",
  SEED = "seed",
  PARTITIONS = "partitions",
  PARTITION = "partition",
  SHARD = "shard",
  PORT = "port",
  HIDE_SKIPS = "hide-skips",
  FAIL_FAST = "fail-fast",
  HEADFUL = "headful",
  COVERAGE = "coverage",
  REST = "rest",
  LIST_BY_SPEC = "list-by-spec",
}

export enum CliCommandKey {
  RUN = "run",
  BUNDLE = "bundle",
  CONFIG = "config",
  HELP = "help",
  PARSE_OPTIONS = "parse-options",
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

export enum StreamFormat {
  TAP = "tap",
  JSONLINES = "json",
  INSPECT = "inspect",
}
