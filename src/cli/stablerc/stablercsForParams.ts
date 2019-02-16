import glob from "fast-glob";
import { relative, dirname, isAbsolute, join } from "path";
import { StablercTaskParams, StablercMatch } from "../interfaces";
import { StablercChain } from "./StablercChain";
import { stablercsForSpecs } from "./stablercsForSpecs";
import { CliArgKey } from "../enums";
import { stat } from "../stat";

export async function stablercsForParams({
  [CliArgKey.WORKING_DIRECTORY]: cwd = process.cwd(),
  [CliArgKey.REST]: explicitFiles = [],
}: StablercTaskParams): Promise<Map<string, StablercMatch>>  {
  if (explicitFiles.length > 1) {
    throw new Error(
      "bundle command takes as its only positional parameter a .stablerc entrypoint",
    );
  }
  const entryfile = await getEntryfile(cwd, explicitFiles[0]);

  console.log(entryfile);

  const chain = await StablercChain.load(entryfile, {
    plugins: false,
    cwd,
  });
  const { document: entry } = chain.flat();
  const specfiles = [];
  const prefix = join(cwd, relative(cwd, dirname(entryfile)));

  for (const include of entry.include) {
    specfiles.push(...(await glob(include, { cwd: dirname(entryfile) })));
  }
  return stablercsForSpecs(specfiles, prefix);
}

async function getEntryfile(cwd: string, entry: string): Promise<string> {
  if (entry === undefined) {
    return defaultEntry(cwd);
  }
  if (!isAbsolute(entry)) {
    entry = join(cwd, entry);
  }
  if (entry.endsWith(".stablerc")) {
    return entry;
  }
  const { isDirectory } = await stat(entry);

  return join(isDirectory ? entry : dirname(entry), ".stablerc");
}

function defaultEntry(cwd: string): string {
  return join(cwd, ".stablerc");
}
