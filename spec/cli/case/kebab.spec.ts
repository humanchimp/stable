import { expect } from "chai";
import { kebab } from "../../../src/cli/case/kebab";

it("should convert from camel", () => {
  expect(kebab("camelCase")).to.equal("camel-case");
});

it("should convert from upper camel", () => {
  expect(kebab("UpperCamel")).to.equal("upper-camel");
});
