import fuzzy from "fuzzy";
import chalk from "chalk";
import { cli } from "./cli";
import { ValidationError } from "./ValidationError";

main().catch(console.error);

async function main() {
  try {
    await cli.runFromArgv(process.argv);
  } catch (reason) {
    if (reason instanceof ValidationError) {
      const [firstInvalid] = reason.invalid.map(i =>
        i
          .trim()
          .split("=")[0]
          .replace(/^--?/, ""),
      );
      const suggestions = fuzzy.filter(firstInvalid, [...reason.command.args]);

      if (suggestions.length > 0) {
        const [{ string: suggestion }] = suggestions;
        console.log(
          `Invalid: ${firstInvalid}\n\nDid you mean ${chalk.bold(
            `--${suggestion}`,
          )}?\n`,
        );
      }
    }
    console.error(reason);
    process.exit(reason.code || 1); // 👋
  }
}
