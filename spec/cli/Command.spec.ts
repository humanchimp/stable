import { expect } from "chai";
import { Command } from "../../src/cli/Command";
import { CliArgKey, CliCommandKey } from "../../src/enums";

describeEach(
  "new Command(params: CommandParams)",
  [
    [{ default: true }],
    [{ default: false }],
    [{ name: "other name" }],
    [{ help: "alt help text" }],
  ],
  ([
    {
      name = CliCommandKey.PARSE_OPTIONS,
      args = [CliArgKey.QUIET, CliArgKey.FILTER], // Selected willy-nilly
      help = "A meta command for unit testing.",
      emoji = "🧶", // Also willy-nilly
      default: isDefault = false,
    },
  ]: [
    {
      name: CliCommandKey;
      args: CliArgKey[];
      help: string;
      emoji: string;
      default: boolean;
    }
  ]) => {
    let subject: Command;

    beforeEach(() => {
      subject = new Command({
        name,
        args,
        help,
        emoji,
        default: isDefault,
      });
    });

    describe(".name", () => {
      it("should reflect the name of the command", () => {
        expect(subject.name).to.equal(name);
      });
    });

    describe(".args", () => {
      it("should reflect the set of arguments that the command accepts", () => {
        for (const arg of args) {
          expect(subject.args.has(arg)).to.be.true;
        }
      });
    });

    describe(".help", () => {
      it("should reflect the help text of the command", () => {
        expect(subject.help).to.equal(help);
      });
    });

    describe(".emoji", () => {
      it("should refect the emoji text of the command", () => {
        expect(subject.emoji).to.equal(emoji);
      });
    });

    describe(".default", () => {
      it("should reflect if the command is the default command", () => {
        expect(subject.default).to.equal(isDefault);
      });
    });

    describe(".validateOptions(args)", () => {
      describeEach(
        "valid case",
        [
          [{ quiet: true, filter: "waldo" }],
          [{ quiet: false }],
          [{ filter: false }],
          [{ help: true }], // "help" is tolerated despite not being explicitly listed
        ],
        ([args]) => {
          it("should return void", () => {
            expect(subject.validateOptions(args)).to.equal(undefined);
          });
        },
      );

      describeEach(
        "invalid case",
        [
          [{ verbose: true }], // "verbose" is not explicitly listed so it's invalid
          [{ fojomdoin: 12 }], // this isn't a thing at all
          [{ bobo: false, gaga: 12 }],
        ],
        ([args]) => {
          it("should throw an error", async () => {
            expect(() => {
              subject.validateOptions(args);
            }).to.throw(/invalid arguments/);
          });
        },
      );
    });
  },
);

describe("when the default parameter is not provided", () => {
  let subject: Command;

  beforeEach(() => {
    subject = new Command({
      name: CliCommandKey.RUN,
      help: "meta command without explicit default option",
      emoji: "🥫",
      args: [],
    });
  });

  it("should default to false", () => {
    expect(subject.default).to.be.false;
  });
});
