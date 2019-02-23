import { expect } from "chai";
import { join } from "path";
import { directoryIncludeForFile } from "../../../src/cli/stablerc/directoryIncludeForFile";

it("should narrow the scope in the case of directories", async () => {
  expect(await directoryIncludeForFile("spec")).to.equal(
    join(process.cwd(), "spec/**"),
  );
  expect(await directoryIncludeForFile(".")).to.equal(
    join(process.cwd(), "**"),
  );
});

it("should just include the path in the case of other files", async () => {
  expect(await directoryIncludeForFile("spec/.stablerc")).to.equal(
    join(process.cwd(), "spec/**"),
  );
  expect(await directoryIncludeForFile(".stablerc")).to.equal(
    join(process.cwd(), "**"),
  );
  expect(await directoryIncludeForFile("spec/framework/.stablerc")).to.equal(
    join(process.cwd(), "spec/framework/**"),
  );
});
