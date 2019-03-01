import { expect } from "chai";
import { castValue } from "../../src/cli/castValue";
import { OptionType } from "../../src/enums";

describe("castValue(value, type)", () => {
  describeEach(
    "valid cast",
    [
      ["sample", OptionType.STRING, "sample"],
      ["0", OptionType.STRING, "0"],
      ["false", OptionType.STRING, "false"],
      ["no", OptionType.STRING, "no"],
      ["off", OptionType.STRING, "off"],
      ["", OptionType.STRING, ""],
      ["1", OptionType.STRING, "1"],
      ["true", OptionType.STRING, "true"],
      ["yes", OptionType.STRING, "yes"],
      ["on", OptionType.STRING, "on"],

      ["0", OptionType.BOOLEAN, false],
      ["false", OptionType.BOOLEAN, false],
      ["no", OptionType.BOOLEAN, false],
      ["off", OptionType.BOOLEAN, false],
      ["", OptionType.BOOLEAN, false],
      ["1", OptionType.BOOLEAN, true],
      ["true", OptionType.BOOLEAN, true],
      ["yes", OptionType.BOOLEAN, true],
      ["on", OptionType.BOOLEAN, true],

      ["0", OptionType.NUMBER, 0],
      ["0.0", OptionType.NUMBER, 0],
      ["0.001", OptionType.NUMBER, 0.001],
      ["1", OptionType.NUMBER, 1],
      ["1e3", OptionType.NUMBER, 1000],
      ["Infinity", OptionType.NUMBER, Infinity],
      ["-10", OptionType.NUMBER, -10],
      // NaN-returning cases tested below...

      ["0", OptionType.STRING_OR_BOOLEAN, false],
      ["false", OptionType.STRING_OR_BOOLEAN, false],
      ["no", OptionType.STRING_OR_BOOLEAN, false],
      ["off", OptionType.STRING_OR_BOOLEAN, false],
      ["", OptionType.STRING_OR_BOOLEAN, false],
      ["1", OptionType.STRING_OR_BOOLEAN, true],
      ["true", OptionType.STRING_OR_BOOLEAN, true],
      ["yes", OptionType.STRING_OR_BOOLEAN, true],
      ["on", OptionType.STRING_OR_BOOLEAN, true],
      ["sample", OptionType.STRING_OR_BOOLEAN, "sample"],
    ],
    ([input, type, expected]) => {
      it("should cast the value as expected by scenario", () => {
        expect(castValue(input, type)).to.equal(expected);
      });
    },
  );

  describeEach(
    "invalid casts",
    [["irrelevant", "not valid"]],
    ([input, badValue]) => {
      it("should throw a TypeError", () => {
        (castValue as any)(input, badValue);
      })
        .shouldFail()
        .rescue(reason => {
          expect(reason.message).to.match(/cannot cast/);
          expect(reason).to.be.instanceOf(TypeError);
        });
    },
  );

  describe("invalid numbers", () => {
    it("should parse as NaN", () => {
      expect(Number.isNaN(castValue("invalid", OptionType.NUMBER) as number)).to
        .be.true;
    });
  });
});
