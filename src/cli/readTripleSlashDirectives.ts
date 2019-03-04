import { createReadStream } from "fs";
import { runnerDirectiveRegex } from "./tripleSlashDirectives";

interface Directive {
  runner?: string;
}

export async function* readTripleSlashDirectives(
  file: string,
): AsyncIterableIterator<Directive> {
  for await (const chunk of createReadStream(file, {
    encoding: "utf-8",
    highWaterMark: 1024,
  })) {
    lines: for (const line of chunk.split("\n")) {
      if (!line.startsWith("///") && line.trim() !== "") {
        return;
      }
      const m = line.match(runnerDirectiveRegex);

      if (m == null) {
        continue lines;
      }
      const [, , , runner] = m;

      yield { runner };
    }
  }
}
