import { expect } from "chai";
import { spy as createSpy } from "sinon";
import { Command } from "../../src/cli/Command";
import { CliArgKey } from "../../src/cli/enums";

describe("Command", () => {
  describeEach(
    "options",
    [
      [{ default: true }],
      [{ default: false }],
      [{ name: "other name" }],
      [{ help: "alt help text" }],
    ],
    ([
      {
        name = "Command",
        args = [CliArgKey.QUIET, CliArgKey.FILTER],
        help = "A meta command for unit testing.",
        emoji = "🧶",
        runSpy = createSpy(),
        task = {
          run() {},
        },
        default: isDefault = false,
      },
    ]) => {
      let subject: Command;

      beforeEach(() => {
        subject = new Command({
          name,
          args,
          help,
          emoji,
          task,
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

      describe(".task", () => {
        it("should have a run method", () => {
          expect(typeof subject.task.run).to.equal("function");
        });
      });

      describe(".run(args, menu)", () => {
        beforeEach(() => {
          // subject.run([], {})
        });

        it("should delegate to the run method of the task", () => {
          // expect(cr)
        });
      });

      describe(".validateArgs(args)", () => {
        describeEach("valid case", [], ([]) => {
          it("should return true");
        });

        describeEach("invalid case", [], ([]) => {
          it("should throw an error");
        });
      });
    },
  );
});
