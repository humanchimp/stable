import { expect } from "chai";
import { instantiatePlugins } from "../../../src/cli/stablerc/instantiatePlugins";

it("should return a promise of a map of name => fully-instantiated plugins from a map of name => config", async () => {
  const stablerc = "spec/framework/.stablerc";
  const instantiated = await instantiatePlugins(
    stablerc,
    new Map<string, any>([
      [
        "fixture",
        {
          include: ["./fixture/**"],
          exclude: ["./fixture/**/*.json"],
        },
      ],
    ]),
  );

  expect(instantiated.get("fixture")).to.exist;
});
