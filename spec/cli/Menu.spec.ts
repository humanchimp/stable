import { expect } from "chai";
import { Menu } from "../../src/cli/Menu";
import { Command, Option } from "../../src/cli/interfaces";
import { OptionType } from "../../src/cli/enums";

describe("Menu", () => {
  let subject: Menu;

  describe("properties", () => {
    beforeEach(() => {
      subject = new Menu({
        commands: ["a", "b", "c"].map(mockCommand),
        options: ["d", "e"].map(mockOption),
      });
    });

    describe(".commands", () => {
      it("should be a map", () => {
        expect(subject.commands).to.be.instanceOf(Map);
      });

      it("should reflect a map of commands by name", () => {
        for (const [key, value] of subject.commands) {
          expect(value.name).to.eql(key);
        }
      });
    });

    describe(".options", () => {
      it("should be a map", () => {
        expect(subject.options).to.be.instanceOf(Map);
      });

      it("should reflect a map of options by name", () => {
        for (const [key, value] of subject.options) {
          expect(value.name).to.eql(key);
        }
      });
    });
  });

  describe(".defaultCommand()", () => {
    describe("when there is a default command", () => {
      it("should return the default command");
    });

    describe("when there is no default command", () => {
      it("????");
    });
  });

  describe(".parseOptions(argv: string[], command: string", () => {
    it("should parse the options into a hash by long kebab-cased name");
  });

  describe(".selectFromArgv(argv: string[])", () => {
    it(
      "should perform the matching command asynchronously and return a promise representing its eventual completion",
    );
  });
});

function mockOption(name): Option {
  return {
    name,
    help: `mock option: ${name}`,
    type: OptionType.STRING_OR_BOOLEAN,
    default: false,
  };
}

function mockCommand(name): Command {
  return {
    name,
    help: `mock command: ${name}`,
    emoji: "🗿",
    args: new Set(),
    task: { run() {} },
    default: false,
    run() {},
  };
}
