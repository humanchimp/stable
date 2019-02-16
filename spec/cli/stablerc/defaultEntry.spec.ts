import { expect } from "chai";
import { defaultEntry } from "../../../src/cli/stablerc/defaultEntry";

it("should append .stablerc to the given cwd", () => {
  expect(defaultEntry("foo")).to.equal("foo/.stablerc");
});
