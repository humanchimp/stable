import { expect } from "chai";
import { spy as createSpy, SinonSpy } from "sinon";
import { Command } from "../../src/cli/Command";
import { Menu, Task } from "../../src/cli/interfaces";
import { CliArgKey } from "../../src/cli/enums";

describe("Command", () => {
  describeEach(
    "parameterization",
    [
      [{ default: true }],
      [{ default: false }],
      [{ name: "other name" }],
      [{ help: "alt help text" }],
    ],
    ([
      {
        name = "Command",
        args = [CliArgKey.QUIET, CliArgKey.FILTER], // Selected willy-nilly
        help = "A meta command for unit testing.",
        emoji = "🧶", // Also willy-nilly
        default: isDefault = false,
      },
    ]) => {
      let subject: Command;
      let menuMock: Menu;
      let taskMock: Task;

      beforeEach(() => {
        taskMock = {
          run: createSpy(),
        };
        subject = new Command({
          name,
          args,
          help,
          emoji,
          task: taskMock,
          default: isDefault,
        });
        menuMock = {
          commands: new Map<string, Command>([[name, subject]]),
          options: args,
          findCommand: createSpy(),
          selectFromArgv: createSpy(),
        };
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
        const args = { quiet: true };

        beforeEach(() => {
          createSpy(subject, "validateArgs");
          subject.run(args, menuMock);
        });

        afterEach(() => {
          (subject.validateArgs as SinonSpy).restore();
        });

        it("should validate the arguments", () => {
          const spy: SinonSpy = subject.validateArgs as SinonSpy;

          expect(spy.calledOnce).to.be.true;
          expect(spy.calledWith(args)).to.be.true;
        });

        it("should delegate to the task's .run() method", () => {
          const spy = taskMock.run as SinonSpy;

          expect(spy.calledOnce).to.be.true;
          expect(spy.calledWith(args)).to.be.true;
        });
      });

      describe(".validateArgs(args)", () => {
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
              expect(subject.run(args, menuMock)).to.be.undefined;
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
            it("should throw an error", () => {
              subject.run(args, menuMock);
            })
              .shouldFail()
              .rescue(reason => {
                expect(reason.message).to.match(/invalid arguments/);
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
        name: 'no default',
        help: "meta command without explicit default option",
        emoji: "🥫",
        args: [],
        task: {
          run() {},
        },
      });
    });

    it("should default to false", () => {
      expect(subject.default).to.be.false;
    });
  });
});
