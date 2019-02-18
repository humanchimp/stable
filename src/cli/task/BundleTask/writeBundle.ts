import { join, basename } from "path";
import sorcery from "sorcery";
import { BundleTaskParams } from "../../interfaces";
import { CliArgKey } from "../../enums";

export async function writeBundle(
  bundle,
  filename,
  {
    [CliArgKey.BUNDLE_FORMAT]: bundleFormat = "iife",
    [CliArgKey.VERBOSE]: verbose = false,
  }: BundleTaskParams,
): Promise<void> {
  await bundle.write({
    file: filename,
    format: bundleFormat,
    sourcemap: "inline",
    globals: {
      sinon: "sinon",
      chai: "chai",
    },
    sourcemapPathTransform(path) {
      return join(__dirname, "../..", basename(path));
    },
  });

  const chain = await sorcery.load(filename);

  await chain.write();
  if (verbose) {
    console.log(`bundle written: ${filename}`); // eslint-disable-line
  }
}
