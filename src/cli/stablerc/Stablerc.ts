import {
  StablercDocument,
  StablercFromFileParams,
  StablercParams,
} from "../interfaces";
import { readFile } from "fs-extra";
import { safeLoad } from "js-yaml";

export class Stablerc {
  static splatDocument(document: StablercDocument) {
    return {
      extends: splat(document.extends),
      include: splat(document.include),
      exclude: splat(document.exclude),
      plugins: document.plugins,
      runners: document.runners,
    };
    function splat(it) {
      return it ? [].concat(it) : [];
    }
  }

  filename: string;

  document: StablercDocument;

  plugins: boolean;

  constructor({ document }: StablercParams) {
    this.document = Stablerc.splatDocument(document);
  }

  static async fromFile(
    filename: string,
    { plugins: shouldLoadPlugins }: StablercFromFileParams,
  ): Promise<Stablerc> {
    const contents = await readFile(filename, "utf-8");
    const data = safeLoad(contents);

    return new Stablerc({
      filename,
      document: {
        extends: data.extends,
        include: data.include,
        exclude: data.exclude,
        plugins: data.plugins,
        runners: data.runners,
      },
    });
  }
}
