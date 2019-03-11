import { expect } from "chai";
import { spy as createSpy, SinonSpy } from "sinon";
import { Menu } from "../../src/cli/Menu";
import { Command, Option, Task } from "../../src/interfaces";
import { OptionType, CliArgKey, CliCommandKey } from "../../src/enums";
import { ValidationError } from "../../src/cli/ValidationError";

const basicOption = {
  short: undefined,
  command: undefined,
  sample: undefined,
  default: undefined,
  expander: undefined,
  *expand() {},
};

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
        ...basicOption,
        name: CliArgKey.PORT,
        short: "s",
        help: "a short option",
        type: OptionType.NUMBER,
        default: 0,
      },
      {
        ...basicOption,
        name: CliArgKey.OUTPUT_FORMAT,
        short: "l",
        help: "an option with a dash",
        type: OptionType.BOOLEAN,
        default: false,
      },
      {
        ...basicOption,
        name: CliArgKey.QUIET,
        short: "b",
        help: "a boolean flag",
        type: OptionType.BOOLEAN,
        default: true,
      },
      {
        ...basicOption,
        name: CliArgKey.GREP,
        help: "a string option with no short and no default",
        type: OptionType.STRING,
        sample: sampleSpy,
      },
      {
        ...basicOption,
        name: CliArgKey.ORDERED,
        help: "a string or boolean option with a string default",
        type: OptionType.STRING_OR_BOOLEAN,
        default: "contrived",
      },
    ];
    explicitCommand = {
      name: CliCommandKey.BUNDLE,
      help: "explicit command",
      emoji: "🗿",
      args: new Set<CliArgKey>([
        CliArgKey.PORT,
        CliArgKey.OUTPUT_FORMAT,
        CliArgKey.QUIET,
        CliArgKey.GREP,
        CliArgKey.ORDERED,
      ]),
      default: false,
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
        [CliCommandKey.BUNDLE],
        {
          port: 0,
          "output-format": false,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "-s", "12"],
        {
          port: 12,
          "output-format": false,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--port=0"],
        {
          port: 0,
          "output-format": false,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "-l", "false"],
        {
          "output-format": false,
          port: 0,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--output-format=true"],
        {
          "output-format": true,
          port: 0,
          quiet: true,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "-b"],
        {
          quiet: true,
          port: 0,
          "output-format": false,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--quiet"],
        {
          quiet: true,
          port: 0,
          "output-format": false,
          grep: undefined,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--grep=hi"],
        {
          grep: "hi",
          port: 0,
          "output-format": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--grep", "get hep"],
        {
          grep: "get hep",
          port: 0,
          "output-format": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "-b", "-l"],
        {
          grep: undefined,
          port: 0,
          "output-format": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "-bl", "--grep", "hi"],
        {
          grep: "hi",
          port: 0,
          "output-format": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--no-output-format"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--no-quiet"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: false,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--quiet", "off"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: false,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--no-quiet", "on"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: false,
          ordered: "contrived",
        },
        ["on"],
      ],
      [
        [CliCommandKey.BUNDLE, "--no-quiet", "--quiet"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--quiet", "--no-quiet"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: false,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "-quiet"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "-quiet", "-no-quiet"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: false,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "-bls", "10"],
        {
          grep: undefined,
          port: 10,
          "output-format": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "-ll"],
        {
          grep: undefined,
          port: 0,
          "output-format": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--output-format"],
        {
          grep: undefined,
          port: 0,
          "output-format": true,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--grep"],
        {
          grep: "",
          port: 0,
          "output-format": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--port=10", "--port"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: true,
          ordered: "contrived",
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "--ordered"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: true,
          ordered: true,
        },
        [],
      ],
      [
        [CliCommandKey.BUNDLE, "foo", "bar"],
        {
          grep: undefined,
          port: 0,
          "output-format": false,
          quiet: true,
          ordered: "contrived",
        },
        ["foo", "bar"],
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
      [[CliCommandKey.BUNDLE, "--rdjodpjsm"], ["--rdjodpjsm"]],
      [[CliCommandKey.BUNDLE, "-j"], ["-j"]],
      [[CliCommandKey.BUNDLE, "-jds"], ["-j", "-d"]],
      [[CliCommandKey.BUNDLE, "--no-port"], ["--no-port"]],
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
    describe("when no matching option has an associated command", () => {
      beforeEach(async () => {
        runSpy = createSpy();
        subject = new Menu({
          commands: [
            {
              name: CliCommandKey.CONFIG,
              help: "help for command",
              emoji: "😇",
              args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
              default: false,
              validateOptions() {},
            },
          ],
          options: [
            {
              ...basicOption,
              name: CliArgKey.QUIET,
              help: "help for a",
              type: OptionType.BOOLEAN,
            },
            {
              ...basicOption,
              name: CliArgKey.PORT,
              help: "help for b",
              type: OptionType.NUMBER,
            },
          ],
        });

        await subject.runFromArgv(
          ["0", "1", CliCommandKey.CONFIG, "--quiet"],
          new Map<CliCommandKey, Task>([
            [
              CliCommandKey.CONFIG,
              {
                run: runSpy,
              },
            ],
          ]),
        );
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
              name: CliCommandKey.CONFIG,
              help: "a command",
              emoji: "😇",
              args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
              default: false,
              validateOptions() {},
            },
            {
              name: CliCommandKey.HELP,
              help: "help for command",
              emoji: "😇",
              args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
              default: false,
              validateOptions() {},
            },
          ],
          options: [
            {
              ...basicOption,
              name: CliArgKey.QUIET,
              help: "help for a",
              type: OptionType.BOOLEAN,
              command: CliCommandKey.HELP,
            },
            {
              ...basicOption,
              name: CliArgKey.PORT,
              help: "help for b",
              type: OptionType.NUMBER,
            },
          ],
        });

        await subject.runFromArgv(
          ["0", "1", CliCommandKey.CONFIG, "--quiet"],
          new Map<CliCommandKey, Task>([
            [CliCommandKey.CONFIG, { run: runSpy }],
            [CliCommandKey.HELP, { run: optionSpy }],
          ]),
        );
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
              name: CliCommandKey.CONFIG,
              help: "a command",
              emoji: "😇",
              args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
              default: false,
              validateOptions() {},
            },
            {
              name: CliCommandKey.HELP,
              help: "a command",
              emoji: "😇",
              args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
              default: false,
              validateOptions() {},
            },
            {
              name: CliCommandKey.PARSE_OPTIONS,
              help: "a command",
              emoji: "😇",
              args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
              default: false,
              validateOptions() {},
            },
          ],
          options: [
            {
              ...basicOption,
              name: CliArgKey.QUIET,
              help: "help for a",
              type: OptionType.BOOLEAN,
              command: CliCommandKey.HELP,
            },
            {
              ...basicOption,
              name: CliArgKey.PORT,
              help: "help for b",
              type: OptionType.NUMBER,
              command: CliCommandKey.PARSE_OPTIONS,
            },
          ],
        });

        await subject.runFromArgv(
          ["0", "1", "command", "--port", "--quiet"],
          new Map<CliCommandKey, Task>([
            [CliCommandKey.CONFIG, { run: runSpy }],
            [CliCommandKey.HELP, { run: optionASpy }],
            [CliCommandKey.PARSE_OPTIONS, { run: optionBSpy }],
          ]),
        );
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

      await subject.runFromArgv(["0", "1", "luke", "--yoda"], new Map());
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
              name: CliCommandKey.HELP,
              help: "help for command",
              emoji: "😇",
              args: new Set<CliArgKey>([CliArgKey.QUIET, CliArgKey.PORT]),
              default: true,
              validateOptions() {},
            },
          ],
          options: [
            {
              ...basicOption,
              name: CliArgKey.QUIET,
              help: "help for a",
              type: OptionType.BOOLEAN,
            },
            {
              ...basicOption,
              name: CliArgKey.PORT,
              help: "help for b",
              type: OptionType.NUMBER,
            },
          ],
        });

        await subject.runFromArgv(
          ["0", "1", "--quiet"],
          new Map<CliCommandKey, Task>([[CliCommandKey.HELP, { run: runSpy }]]),
        );
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

    expect(subject.commands.get(CliCommandKey.PARSE_OPTIONS)).to.exist;
  });

  it("should not have the `parse-options` command otherwise", () => {
    subject = new Menu({
      commands: [],
      options: [],
    });

    expect(subject.commands.get(CliCommandKey.PARSE_OPTIONS)).not.to.exist;
    expect(subject.commands.size).to.equal(0);
  });
});

describe("when an option has an expander", () => {
  it("should expand the options accordingly", () => {
    const option: Option = {
      ...mockOption(CliArgKey.HEADFUL),
      default: true,
      *expand(value: number, menu: Menu): IterableIterator<[CliArgKey, any]> {
        yield [CliArgKey.GREP, "123"];
        yield [CliArgKey.FORCE, 876];
        yield [CliArgKey.COVERAGE, value];
        yield [CliArgKey.FILTER, menu];
      },
    };
    const subject = new Menu({
      options: [option],
      commands: [
        {
          ...mockCommand(CliCommandKey.RUN),
          args: new Set([
            CliArgKey.HEADFUL,
            CliArgKey.GREP,

            // ...intentionally omitting the others
          ]),
        },
      ],
    });
    const { options } = subject.commandFromArgv(["run", "--headful"]);

    expect(options).to.eql({
      coverage: true,
      filter: subject,
      force: 876,
      grep: "123",
      headful: true,
    });
  });
});

function mockOption(name): Option {
  return {
    ...basicOption,
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
    default: false,
    validateOptions() {},
  };
}
