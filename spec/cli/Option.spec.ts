import { expect } from "chai";
import { Option } from "../../src/cli/Option";
import { OptionType, CliCommandKey, CliArgKey } from "../../src/enums";
import { Menu } from "../../src/interfaces";

describeEach(
  "new Option(params: OptionParams)",
  [
    [{}],
    [{ type: OptionType.NUMBER, default: 0 }],
    [{ type: OptionType.STRING, default: "ok" }],
    [{ type: OptionType.STRING_OR_BOOLEAN, default: true }],
    [{ command: CliCommandKey.HELP }],
    [{ *expand() {} }],
  ],
  ([
    {
      name = "option",
      short = undefined,
      help = "A meta option for unit testing.",
      type = OptionType.BOOLEAN,
      default: defaultValue = false,
      command = undefined,
      expand = undefined,
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
        command,
        expand,
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

    describe(".command", () => {
      it("should reflect the name of the associated command, if any", () => {
        expect(subject.command).to.equal(command);
      });
    });

    describe(".expander", () => {
      it("should reflect the value that was provided as the *expand* parameter", () => {
        expect(subject.expander).to.equal(expand);
      });
    });
  },
);

describe(".expand(): IterableIterator<[CliArgKey, any]>", () => {
  describe("when there is an expander", () => {
    let subject: Option;

    beforeEach(() => {
      subject = new Option({
        name: CliArgKey.SHARD,
        help: "has an expander.",
        type: OptionType.NUMBER,
        *expand(value: number, option: Option, menu: Menu) {
          yield [CliArgKey.PARTITION, 1 * value];
          yield [CliArgKey.PARTITIONS, 8 * value];
          yield [CliArgKey.PORT, option];
          yield [CliArgKey.QUIET, menu];
        },
      });
    });

    it("should delegate to its expander", () => {
      const mockMenu = {} as Menu;
      const iterator = subject.expand(11, mockMenu);

      expect(iterator.next()).to.eql({
        value: [CliArgKey.PARTITION, 11],
        done: false,
      });
      expect(iterator.next()).to.eql({
        value: [CliArgKey.PARTITIONS, 88],
        done: false,
      });
      expect(iterator.next()).to.eql({
        value: [CliArgKey.PORT, subject],
        done: false,
      });
      expect(iterator.next()).to.eql({
        value: [CliArgKey.QUIET, mockMenu],
        done: false,
      });
      expect(iterator.next()).to.eql({ value: undefined, done: true });
    });
  });

  describe("when there isn't an expander", () => {
    let subject: Option;

    beforeEach(() => {
      subject = new Option({
        name: CliArgKey.HELP,
        help: "blah blah.",
        type: OptionType.STRING_OR_BOOLEAN,
      });
    });

    it("should do nothing", () => {
      const iterator = subject.expand(11, {} as Menu);

      expect(iterator.next()).to.eql({ value: undefined, done: true });
    });
  });
});
