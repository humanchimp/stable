import { expect } from "chai";
import { stablercsForSpecs } from "../../../src/cli/stablerc/stablercsForSpecs";
import { StablercMatch } from "../../../src/cli/interfaces";

describe("stablercsForSpecs", () => {
  const specs = ["spec/framework/Suite.ts", "spec/framework/Spec.ts"];
  let subject: Map<string, StablercMatch>;

  beforeEach(async () => {
    subject = await stablercsForSpecs(specs);
  });

  it("should load a map of the .stablercs relative to the specs", () => {
    const values = [...subject.values()];

    expect(values).to.have.lengthOf(1);

    const [
      {
        config: { filename, document: config },
        files,
      },
    ] = values;

    expect(files).to.eql(specs);
    expect(filename).to.equal("spec/framework/.stablerc");
    expect(config).to.eql({
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
  });
});
