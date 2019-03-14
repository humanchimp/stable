#!/usr/bin/env node

import { cli } from "./cli";
import { Task } from "../interfaces";
import { RunTask } from "./task/RunTask";
import { BundleTask } from "./task/BundleTask";
import { PrintConfigTask } from "./task/PrintConfigTask";
import { PrintHelpMenuTask } from "./task/PrintHelpMenuTask";
import { CliCommandKey } from "../enums";

/* eslint-disable no-console */
main();

async function main() {
  try {
    await cli.runFromArgv(
      process.argv,
      new Map<string, Task>([
        [CliCommandKey.RUN, new RunTask()],
        [CliCommandKey.BUNDLE, new BundleTask()],
        [CliCommandKey.CONFIG, new PrintConfigTask()],
        [CliCommandKey.HELP, new PrintHelpMenuTask()],
        [
          CliCommandKey.PARSE_OPTIONS,
          {
            run(options) {
              console.log(options);
            },
          },
        ],
      ]),
    );
  } catch (reason) {
    console.error(reason);
    process.exit(reason.code || 1); // 👋
  }
}
/* eslint-enable no-console */
