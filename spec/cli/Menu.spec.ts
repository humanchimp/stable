import { expect } from "chai";
import { spy as createSpy, SinonSpy } from "sinon";
import { Menu } from "../../src/cli/Menu";
import { Command, Option } from "../../src/cli/interfaces";
import { OptionType, CliArgKey } from "../../src/cli/enums";

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

  describe(".commandForArgv(argv: string[])", () => {
    const options = [
      {
        name: CliArgKey.PORT,
        short: "s",
        help: "a short option",
        type: OptionType.NUMBER,
        default: 0,
      },
      {
        name: CliArgKey.LIST_BY_SPEC,
        short: "l",
        help: "an option with a dash",
        type: OptionType.BOOLEAN,
        default: false,
      },
      {
        name: CliArgKey.QUIET,
        short: "b",
        help: "a boolean flag",
        type: OptionType.BOOLEAN,
        default: false,
      },
      {
        name: CliArgKey.GREP,
        help: "a string option with no short and no default",
        type: OptionType.STRING,
      },
    ];
    const explicitCommand = {
      name: "explicit-command",
      help: "explicit command",
      emoji: "🗿",
      args: new Set<CliArgKey>([
        CliArgKey.PORT,
        CliArgKey.LIST_BY_SPEC,
        CliArgKey.QUIET,
        CliArgKey.GREP,
      ]),
      task: { run() {} },
      default: false,
      run() {},
      validateOptions() {},
    };
    const defaultCommand = { ...mockCommand("default-command"), default: true };

    beforeEach(() => {
      subject = new Menu({
        commands: [explicitCommand, defaultCommand],
        options,
      });
    });

    describeEach(
      "option for an explicit command",
      [
        // These are cherry-picked and overly naive during bootstrapping
        [
          ["explicit-command"],
          {
            port: 0,
            "list-by-spec": false,
            quiet: false,
            grep: undefined,
          },
          [],
        ],
        [
          ["explicit-command", "-s", "12"],
          {
            port: 12,
            "list-by-spec": false,
            quiet: false,
            grep: undefined,
          },
          [],
        ],
        [
          ["explicit-command", "--port=0"], // CliArgKey.PORT is used for testing
          {
            port: 0,
            "list-by-spec": false,
            quiet: false,
            grep: undefined,
          },
          [],
        ],
        [
          ["explicit-command", "-l", "false"],
          {
            "list-by-spec": false,
            port: 0,
            quiet: false,
            grep: undefined,
          },
          [],
        ],
        [
          ["explicit-command", "--list-by-spec=true"], // CliArgKey.LIST_BY_SPEC is used for testing
          {
            "list-by-spec": true,
            port: 0,
            quiet: false,
            grep: undefined,
          },
          [],
        ],
        [
          ["explicit-command", "-b"],
          {
            quiet: true,
            port: 0,
            "list-by-spec": false,
            grep: undefined,
          },
          [],
        ],
        [
          ["explicit-command", "--quiet"], // CliArgKey.QUIET is used for testing
          {
            quiet: true,
            port: 0,
            "list-by-spec": false,
            grep: undefined,
          },
          [],
        ],
        [
          ["explicit-command", "--grep=hi"], // CliArgKey.GREP is used for testing
          {
            grep: "hi",
            port: 0,
            "list-by-spec": false,
            quiet: false,
          },
          [],
        ],
        [
          ["explicit-command", "--grep", "get hep"], // CliArgKey.GREP is used for testing
          {
            grep: "get hep",
            port: 0,
            "list-by-spec": false,
            quiet: false,
          },
          [],
        ],
        [
          ["explicit-command", "-b", "-l"], // CliArgKey.GREP is used for testing
          {
            grep: undefined,
            port: 0,
            "list-by-spec": true,
            quiet: true,
          },
          [],
        ],
        [
          ["explicit-command", "-bl", "--grep", "hi"], // CliArgKey.GREP is used for testing
          {
            grep: "hi",
            port: 0,
            "list-by-spec": true,
            quiet: true,
          },
          [],
        ],
      ],
      ([argv, expected, expectRest]) => {
        it("should summon the matching command", () => {
          const { command } = subject.commandFromArgv(argv);

          expect(command).to.equal(explicitCommand);
        });

        it("should parse the options into a hash by long kebab-cased name", () => {
          const { options } = subject.commandFromArgv(argv);

          expect(options).to.eql(expected);
        });

        it("should collect the rest of the positional arguments in an array", () => {
          const { rest } = subject.commandFromArgv(argv);

          expect(rest).to.eql(expectRest);
        });
      },
    );
  });

  describe(".runFromArgv(argv: string[])", () => {
    let commandSpy: SinonSpy, runSpy: SinonSpy;

    describe("with an explicit command", () => {
      describe("when no matching option has a task", () => {
        beforeEach(async () => {
          runSpy = createSpy();
          subject = new Menu({
            commands: [
              {
                name: "command",
                help: "help for command",
                emoji: "😇",
                task: { run() {} },
                args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
                default: false,
                run: runSpy,
                validateOptions() {},
              },
            ],
            options: [
              {
                name: CliArgKey.QUIET,
                help: "help for a",
                type: OptionType.BOOLEAN,
              },
              {
                name: CliArgKey.PORT,
                help: "help for b",
                type: OptionType.NUMBER,
              },
            ],
          });

          await subject.runFromArgv(["0", "1", "command", "--quiet"]);
        });

        it("should perform the task attached to the matching command asynchronously and return a promise representing its eventual completion", () => {
          expect(runSpy.calledOnce).to.be.true;
        });
      });

      describe("when a matching option has a task", () => {
        let optionSpy: SinonSpy;

        beforeEach(async () => {
          runSpy = createSpy();
          optionSpy = createSpy();
          subject = new Menu({
            commands: [
              {
                name: "command",
                help: "help for command",
                emoji: "😇",
                task: { run() {} },
                args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
                default: false,
                run: runSpy,
                validateOptions() {},
              },
            ],
            options: [
              {
                name: CliArgKey.QUIET,
                help: "help for a",
                type: OptionType.BOOLEAN,
                task: { run: optionSpy },
              },
              {
                name: CliArgKey.PORT,
                help: "help for b",
                type: OptionType.NUMBER,
              },
            ],
          });

          await subject.runFromArgv(["0", "1", "command", "--quiet"]);
        });

        it("should perform the task of the matching option asynchronously and return a promise representing its eventual completion", async () => {
          expect(optionSpy.calledOnce).to.be.true;
        });

        it("should not perform the task attached to the matching command", () => {
          expect(runSpy.called).to.be.false;
        });
      });

      describe("when multiple matching options have tasks", () => {
        let optionASpy: SinonSpy, optionBSpy: SinonSpy;

        beforeEach(async () => {
          runSpy = createSpy();
          optionASpy = createSpy();
          optionBSpy = createSpy();
          subject = new Menu({
            commands: [
              {
                name: "command",
                help: "help for command",
                emoji: "😇",
                task: { run() {} },
                args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
                default: false,
                run: runSpy,
                validateOptions() {},
              },
            ],
            options: [
              {
                name: CliArgKey.QUIET,
                help: "help for a",
                type: OptionType.BOOLEAN,
                task: { run: optionASpy },
              },
              {
                name: CliArgKey.PORT,
                help: "help for b",
                type: OptionType.NUMBER,
                task: { run: optionBSpy },
              },
            ],
          });

          await subject.runFromArgv(["0", "1", "command", "--port", "--quiet"]);
        });

        it(
          "should perform the task of only the *last* matching option asynchronously and return a promise representing its eventual completion",
        );

        it("should not perform the task attached to the matching command");
      });
    });

    describe("when no command is given", () => {
      describe("when the no matching option has a task", () => {
        beforeEach(async () => {
          runSpy = createSpy();
          subject = new Menu({
            commands: [
              {
                name: "command",
                help: "help for command",
                emoji: "😇",
                task: { run() {} },
                args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
                default: true,
                run: runSpy,
                validateOptions() {},
              },
            ],
            options: [
              {
                name: CliArgKey.QUIET,
                help: "help for a",
                type: OptionType.BOOLEAN,
              },
              {
                name: CliArgKey.PORT,
                help: "help for b",
                type: OptionType.NUMBER,
              },
            ],
          });

          await subject.runFromArgv(["0", "1", "--quiet"]);
        });

        it("should perform the task attached to the default command asynchronously and return a promise representing its eventual completion", () => {
          expect(runSpy.calledOnce).to.be.true;
        });
      });

      describe("when a matching option has a task", () => {
        it(
          "should perform the task attached to the matching option asynchronously and return a promise representing its eventual completion",
        );

        it("should not perform the task attached to the default command");
      });

      describe("when multiple matching options have tasks", () => {
        it(
          "should perform the task of only the *last* matching option asynchronously and return a promise representing its eventual completion",
        );

        it("should not perform the task attached to the default command");
      });
    });
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
    validateOptions() {},
  };
}
