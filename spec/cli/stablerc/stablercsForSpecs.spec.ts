import { expect } from "chai";
import { stablercsForSpecs } from "../../../src/cli/stablerc/stablercsForSpecs";
import { StablercFile } from "../../../src/cli/stablerc/StablercFile";

console.log(stablercsForSpecs);

describe("stablercsForSpecs", () => {
  let subject: Map<
    string,
    {
      config: StablercFile;
      files: string[];
    }
  >;

  beforeEach(async () => {
    subject = await stablercsForSpecs([
      "spec/framework/Suite.ts",
      "spec/framework/Spec.ts",
    ]);
  });

  it("should load a map of the stablercs relative to the specs", () => {
    for (const [filename, { config }] of subject.entries()) {
      expect(filename).to.equal("spec/framework/.stablerc");
      expect(config.document).to.eql({
        extends: [],
        include: ["./**.spec.ts"],
        exclude: [],
        plugins: [
          ["timing", { timeout: 500 }],
          ["rescue", undefined],
          ["fixture", { include: ["spec/fixture/**/*"] }],
        ],
        runners: ["isolate", "headless chrome"],
      });
    }
  });
});
