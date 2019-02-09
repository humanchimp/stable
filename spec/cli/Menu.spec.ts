import { expect } from "chai";
import { spy as createSpy, SinonSpy } from "sinon";
import { Menu } from "../../src/cli/Menu";
import { Command, Option } from "../../src/cli/interfaces";
import { OptionType, CliArgKey } from "../../src/cli/enums";
import { ValidationError } from "../../src/cli/ValidationError";

let subject: Menu;

afterEach(() => {
  subject = undefined;
});

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
  let options: Option[],
    explicitCommand: Command,
    defaultCommand: Command,
    sampleSpy: SinonSpy;

  beforeEach(() => {
    sampleSpy = createSpy(it => it[it.length - 1]);
    options = [
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
        default: true,
      },
      {
        name: CliArgKey.GREP,
        help: "a string option with no short and no default",
        type: OptionType.STRING,
        sample: sampleSpy,
      },
      {
        name: CliArgKey.ORDERED,
        help: "a string or boolean option with a string default",
        type: OptionType.STRING_OR_BOOLEAN,
        default: "contrived",
      },
    ];
    explicitCommand = {
      name: "explicit-command",
      help: "explicit command",
      emoji: "🗿",
      args: new Set<CliArgKey>([
        CliArgKey.PORT,
        CliArgKey.LIST_BY_SPEC,
        CliArgKey.QUIET,
        CliArgKey.GREP,
        CliArgKey.ORDERED,
      ]),
      task: { run() {} },
      default: false,
      run() {},
      validateOptions() {},
    };
    defaultCommand = { ...mockCommand("default-command"), default: true };
  });

  beforeEach(() => {
    subject = new Menu({
      commands: [explicitCommand, defaultCommand],
      options,
    });
  });

  describeEach(
    "valid cases with an explicit command",
    [
      // These are cherry-picked and overly naive during bootstrapping
      [
        ["explicit-command"],
        {
          port: 0,
          "list-by-spec": false,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "-s", "12"],
        {
          port: 12,
          "list-by-spec": false,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--port=0"],
        {
          port: 0,
          "list-by-spec": false,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "-l", "false"],
        {
          "list-by-spec": false,
          port: 0,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--list-by-spec=true"],
        {
          "list-by-spec": true,
          port: 0,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
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
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--quiet"],
        {
          quiet: true,
          port: 0,
          "list-by-spec": false,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--grep=hi"],
        {
          grep: "hi",
          port: 0,
          "list-by-spec": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--grep", "get hep"],
        {
          grep: "get hep",
          port: 0,
          "list-by-spec": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "-b", "-l"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "-bl", "--grep", "hi"],
        {
          grep: "hi",
          port: 0,
          "list-by-spec": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--no-list-by-spec"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--no-quiet"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": false,
          quiet: false,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--quiet", "off"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": false,
          quiet: false,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--no-quiet", "on"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": false,
          quiet: false,
          ordered: "contrived",
        },
        ["on"],
      ],
      [
        ["explicit-command", "--no-quiet", "--quiet"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--quiet", "--no-quiet"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": false,
          quiet: false,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "-bls", "10"],
        {
          grep: undefined,
          port: 10,
          "list-by-spec": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "-ll"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--list-by-spec"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--grep"],
        {
          grep: "",
          port: 0,
          "list-by-spec": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--port=10", "--port"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        ["explicit-command", "--ordered"],
        {
          grep: undefined,
          port: 0,
          "list-by-spec": false,
          quiet: true,
          ordered: true,
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

  describeEach(
    "invalid cases with an explicit command and an unintelligible argument",
    [
      [["explicit-command", "--rdjodpjsm"], ["--rdjodpjsm"]],
      [["explicit-command", "-j"], ["-j"]],
      [["explicit-command", "-jds"], ["-j", "-d"]],
      [["explicit-command", "--no-port"], ["--no-port"]],
    ],
    ([argv, expectedInvalid]) => {
      it("should collect the invalid parameters", () => {
        const { invalid } = subject.commandFromArgv(argv);

        expect(invalid).to.eql(expectedInvalid);
      });
    },
  );

  describe("when the option has a sample method", () => {
    it("should delegate to the sample method instead of just calling taking the last one", () => {});
  });
});

describe(".runFromArgv(argv: string[])", () => {
  let runSpy: SinonSpy;

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

  describe("when an option is present that is invalid globally", () => {
    it("should throw a validation error", async () => {
      subject = new Menu({
        commands: [mockCommand("luke")],
        options: [],
      });

      await subject.runFromArgv(["0", "1", "luke", "--yoda"]);
    })
      .shouldFail()
      .rescue(reason => {
        expect(reason).to.be.instanceOf(ValidationError);
        expect(reason.message).to.match(/unintelligible arguments/);
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

describe("debug mode", () => {
  it("should append the `parse-options` command for debugging the argv parser itself", async () => {
    subject = new Menu({
      commands: [],
      options: [],
      debug: true,
    });

    const command = subject.commands.get("parse-options");

    expect(command).to.exist;
    createSpy(console, "log");
    command.run([], subject);
    expect((console.log as SinonSpy).calledOnce).to.be.true;
    (console.log as SinonSpy).restore();
  });

  it("should not have the `parse-options` command otherwise", () => {
    subject = new Menu({
      commands: [],
      options: [],
    });

    expect(subject.commands.get("parse-options")).not.to.exist;
    expect(subject.commands.size).to.equal(0);
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
