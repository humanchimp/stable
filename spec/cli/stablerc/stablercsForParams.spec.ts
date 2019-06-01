import { expect } from "chai";
import { stablercsForParams } from "../../../src/cli/stablerc/stablercsForParams";
import { StablercMatch } from "../../../src/interfaces";
import { CliArgKey } from "../../../src/enums";

describe("stablercsForParams(params: StablercTaskParams): Promise<Map<string, StablercMatch>> ", () => {
  let map: Map<string, StablercMatch>;

  describeEach(
    "params",
    [
      [
        {
          [CliArgKey.WORKING_DIRECTORY]: __dirname,
          [CliArgKey.REST]: ["spec/framework/Spec.spec.ts"],
        },
      ],
      [
        {
          [CliArgKey.WORKING_DIRECTORY]: __dirname,
          [CliArgKey.REST]: [],
        },
      ],
      [
        {
          [CliArgKey.WORKING_DIRECTORY]: undefined,
          [CliArgKey.REST]: [],
        },
      ],
      [
        {
          [CliArgKey.WORKING_DIRECTORY]: "/dev/null",
          [CliArgKey.REST]: [],
        },
      ],
    ],
    ([params]) => {
      beforeEach(async () => {
        map = await stablercsForParams(params);
      });

      it("should work", () => {
        console.log("map", map);
        expect(stablercsForParams).to.exist;
      });
    },
  );
});
