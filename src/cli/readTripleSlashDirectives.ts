import { createReadStream } from "fs";
import { runnerDirectiveRegex } from "./tripleSlashDirectives";

interface Directive {
  runner?: string;
}

export async function* readTripleSlashDirectives(
  file: string,
): AsyncIterableIterator<Directive> {
  const readStream = createReadStream(file, {
    encoding: "utf8",
    highWaterMark: 1024,
  });

  for await (const chunk of readStream) {
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
