import { expect } from "chai";
import { Option } from "../../src/cli/Option";
import { OptionType } from "../../src/cli/enums";

describe("Option", () => {
  describeEach(
    "parameterization",
    [
      [{}],
      [{ type: OptionType.NUMBER, default: 0 }],
      [{ type: OptionType.STRING, default: "ok" }],
      [{ type: OptionType.STRING_OR_BOOLEAN, default: true }],
      [{ task() {} }],
    ],
    ([
      {
        name = "option",
        short = undefined,
        help = "A meta option for unit testing.",
        type = OptionType.BOOLEAN,
        default: defaultValue = false,
        task = undefined,
      },
    ]) => {
      let subject: Option;

      beforeEach(() => {
        subject = new Option({
          name,
          short,
          help,
          type,
          default: defaultValue,
          task,
        });
      });

      describe(".name", () => {
        it("should reflect the name of the option", () => {
          expect(subject.name).to.equal(name);
        });
      });

      describe(".short", () => {
        it("should reflect the short name of option if any", () => {
          expect(subject.short).to.equal(short);
        });
      });

      describe(".help", () => {
        it("should reflect the help text of the option", () => {
          expect(subject.help).to.equal(help);
        });
      });

      describe(".type", () => {
        it("should reflect the type of the option", () => {
          expect(subject.type).to.equal(type);
        });
      });

      describe(".default", () => {
        it("should reflect the default value for the option", () => {
          expect(subject.default).to.equal(defaultValue);
        });
      });

      describe(".task", () => {
        it("should reflect the task attached to the pseudo-option, if any", () => {
          expect(subject.task).to.equal(task);
        });
      });
    },
  );
});
