import { expect } from "chai";
import { spy } from "sinon";
import { Suite } from "../src/Suite";
import { describe as createSuite } from "../src/describe";

describe("static factories/explicit casts", () => {
  let suites, subject;

  beforeEach(() => {
    suites = [createSuite("a"), createSuite("b")];
  });

  describe("Suite.from(suites)", () => {
    beforeEach(() => {
      subject = Suite.from(suites);
    });

    it("should be instance of Suite", () => {
      expect(subject).to.be.instanceOf(Suite);
    });

    it("should reduce an array of suites to a single suite", () => {
      expect(subject.suites).to.eql(suites);
    });

    it("should have a null description", () => {
      expect(subject.description).to.be.null;
    });
  });

  describe("Suite.of(...suites)", () => {
    beforeEach(() => {
      spy(Suite, "from");
      subject = Suite.of(...suites);
    });

    afterEach(() => {
      Suite.from.restore();
    });

    it("should delegate to Suite.from", () => {
      expect(Suite.from.calledOnce).to.be.true;
    });

    it("should be called with the splatted rest param", () => {
      expect(Suite.from.getCall(0).args[0]).to.eql(suites);
    });
  });
});
