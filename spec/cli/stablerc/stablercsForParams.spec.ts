import { expect } from "chai";
import { stablercsForParams } from "../../../src/cli/stablerc/stablercsForParams";
import { StablercMatch } from "../../../src/cli/interfaces";
import { CliArgKey } from "../../../src/cli/enums";

describe("stablercsForParams(params: StablercTaskParams): Promise<Map<string, StablercMatch>> ", () => {
  let map: Map<string, StablercMatch>;

  beforeEach(async () => {
    map = await stablercsForParams({
      [CliArgKey.WORKING_DIRECTORY]: __dirname,
      [CliArgKey.REST]: ["spec/framework/Spec.spec.ts"],
    });
  });

  it("should work", () => {
    console.log("map", map);
    // expect(stablercsForParams).to.exist;
  });
});

describe("when passing multiple explicit files", () => {
  it("throws for now", async () => {
    await stablercsForParams({
      [CliArgKey.WORKING_DIRECTORY]: undefined,
      [CliArgKey.REST]: ["1", "2"],
    });
  })
    .shouldFail()
    .rescue(reason => {
      expect(reason.message).to.match(
        /bundle command takes as its only positional parameter a .stablerc entrypoint/,
      );
    });
});
