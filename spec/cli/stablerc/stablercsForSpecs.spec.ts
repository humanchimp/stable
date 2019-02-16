import { expect } from "chai";
import { stablercsForSpecs } from "../../../src/cli/stablerc/stablercsForSpecs";
import { StablercMatch } from "../../../src/cli/interfaces";

describe("stablercsForSpecs", () => {
  let subject: Map<string, StablercMatch>;

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
          ["rescue"],
          ["fixture", { include: ["spec/fixture/**/*"] }],
        ],
        runners: ["isolate", "headless chrome"],
      });
    }
  });
});
