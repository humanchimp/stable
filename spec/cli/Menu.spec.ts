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
      beforeEach(() => {
        subject = new Menu({
          commands: [
            mockCommand("a"),
            { ...mockCommand("b"), default: true },
            mockCommand("c"),
          ],
          options: [],
        });
      });

      it("should return the default command", () => {
        expect(subject.defaultCommand().name).to.equal("b");
      });
    });

    describe("when there is no default command", () => {
      beforeEach(() => {
        subject = new Menu({
          commands: ["a", "b", "c"].map(mockCommand),
          options: [],
        });
      });

      it("should throw an error", () => {
        subject.defaultCommand();
      })
        .shouldFail()
        .rescue(reason => {
          expect(reason.message).to.match(/no default command/);
        });
    });
  });

  describe(".parseOptions(argv: string[], command: string", () => {
    const explicitCommand = mockCommand("command");
    const defaultCommand = { ...mockCommand("default-command"), default: true };

    beforeEach(() => {
      subject = new Menu({
        commands: [explicitCommand, defaultCommand],
        options: [
          {
            name: "short",
            short: "s",
            help: "a short option",
            type: OptionType.NUMBER,
            default: 0,
          },
          {
            name: "long-option",
            short: "l",
            help: "an option with a dash",
            type: OptionType.BOOLEAN,
            default: false,
          },
          {
            name: "boolean",
            short: "b",
            help: "a boolean flag",
            type: OptionType.BOOLEAN,
            default: false,
          },
          {
            name: "string",
            help: "a string option with no short",
            type: OptionType.STRING,
            default: "",
          },
        ],
      });
    });

    describeEach(
      "option for an explicit command",
      [
        // These are cherry-picked and overly naive during bootstrapping
        ["0", "1"],
        ["0", "1", "command"],
        ["0", "1", "command", "-s", "12"],
        ["0", "1", "command", "--short", "0"],
        ["0", "1", "command", "--l", "false"],
        ["0", "1", "command", "--long-option", "true"],
        ["0", "1", "command", "-b"],
        ["0", "1", "command", "--boolean"],
        ["0", "1", "command", "--string", "hi"],
      ],
      argv => {
        it("should parse the options into a hash by long kebab-cased name", () => {
          console.log(subject.parseOptions(argv, explicitCommand));
        });
      },
    );
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
