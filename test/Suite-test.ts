import { expect } from "chai";
import { spy } from "sinon";
import { Suite } from "../src/Suite";
import { Hooks } from "../src/Hooks";
import { Listeners } from "../src/Listeners";
import { describe as createSuite } from "../src/describe";

describe("static factories/explicit casts", () => {
  let suites, subject;

  beforeEach(() => {
    suites = [createSuite("a"), createSuite("b")];
  });

  describe("Suite.from(suites)", () => {
    describe("otherwise", () => {
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

    describe("when the array contains a single suite", () => {
      beforeEach(() => {
        subject = Suite.from([suites[0]]);
      });

      it("should return the suite itself", () => {
        expect(subject).to.equal(suites[0]);
      });
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

describe("new Suite(description)", () => {
  const description = "yep fancy description";
  let subject;

  beforeEach(() => {
    subject = new Suite(description);
  });

  it("should produce a new instance of Suite", () => {
    expect(subject).to.be.instanceOf(Suite);
  });

  describe(".description", () => {
    it("should have the given description", () => {
      expect(subject.description).to.equal(description);
    });
  });

  describe(".parent", () => {
    it("should be undefined", () => {
      expect(subject.parent).to.be.undefined;
    });
  });

  describe(".skipped", () => {
    it("should be false", () => {
      expect(subject.skipped).to.be.false;
    });
  });

  describe(".focused", () => {
    it("should not be focued", () => {
      expect(subject.focused).to.be.false;
    });
  });

  describe(".hooks", () => {
    it("should be an instance of Hooks", () => {
      expect(subject.hooks).to.be.instanceOf(Hooks);
    });

    it("should be empty", () => {
      expect(subject.hooks).to.eql({
        beforeAll: [],
        afterAll: [],
        beforeEach: [],
        afterEach: [],
      });
    });
  });

  describe(".listeners", () => {
    it("should be an instance of Listeners", () => {
      expect(subject.listeners).to.be.instanceOf(Listeners);
    });

    it("should be empty", () => {
      expect(subject.listeners).to.eql({
        pending: [],
        complete: [],
      });
    });
  });

  describe(".isFocusMode", () => {
    it("should be false", () => {
      expect(subject.isFocusMode).to.be.false;
    });

    it("can be toggled", () => {
      subject.isFocusMode = true;
      expect(subject.isFocusMode).to.be.true;
      subject.isFocusMode = false;
      expect(subject.isFocusMode).to.be.false;
      subject.isFocusMode = true;
      expect(subject.isFocusMode).to.be.true;
    });

    describe("downward propagation and fanout", () => {
      beforeEach(() => {
        subject.describe("outer 1", s =>
          s
            .describe("inner 1", s2 =>
              s2.describe("nested 1", noop).describe("nested 2", noop),
            )
            .describe("inner 2", s2 =>
              s2.describe("nested 3", noop).describe("nested 4", noop),
            ),
        );
        subject.describe("outer 2", s =>
          s
            .describe("inner 3", s2 =>
              s2.describe("nested 5", noop).describe("nested 6", noop),
            )
            .describe("inner 4", s2 =>
              s2.describe("nested 7", noop).describe("nested 8", noop),
            ),
        );
      });

      describe("when set to true", () => {
        beforeEach(() => {
          subject.isFocusMode = true;
        });

        it("should propagate downward, and fan out", () => {
          checkIsFocusModeDeeply(subject, true);
        });

        it("should not be possible to unset", () => {
          subject.isFocusMode = false;
          checkIsFocusModeDeeply(subject, true);
        });
      });

      function checkIsFocusModeDeeply(suite, expected) {
        for (const s of suite.suites) {
          expect(s.isFocusMode).to.equal(expected);
          for (const s2 of s.suites) {
            expect(s2.isFocusMode).to.equal(expected);
            for (const s3 of s2.suites) {
              expect(s3.isFocusMode).to.equal(expected);
            }
          }
        }
      }
    });
  });

  describe(".isDeeplyFocused", () => {
    it("should be false be default", () => {
      expect(subject.isDeeplyFocused).to.be.false;
    });

    describe("when the suite itself is focused", () => {
      beforeEach(() => {
        subject.focus = true;
      });

      it("should be false", () => {
        expect(subject.isDeeplyFocused).to.be.false;
      });
    });

    describe("when a child spec is focused", () => {
      beforeEach(() => {
        subject.fit("focused", noop).it("not focused for control sake");
      });

      it("should be true", () => {
        expect(subject.isDeeplyFocused).to.be.true;
      });
    });

    describe("when a child suite is focused", () => {
      beforeEach(() => {
        subject.fdescribe("focused", noop).describe("not focused for control sake", noop);
      });

      it("should be true", () => {
        expect(subject.isDeeplyFocused).to.be.true;
      });
    });

    describe("when a descendant spec is focused", () => {
      beforeEach(() => {
        subject.describe("outer", s => {
          s.describe("inner 1", s2 => {
            s2.fit("focused", noop).it("not focused for control sake");
          }).describe("inner 2", s2 => {
            s2.it("not focused for control sake");
          });
        });
      });

      it("should be true", () => {
        expect(subject.isDeeplyFocused).to.be.true;
      });
    });

    describe("when a descendant suite is focused", () => {
      beforeEach(() => {
        subject.describe("outer", s => {
          s.fdescribe("focused", noop).describe("not focused for control sake", noop);
        });
      });

      it("should be true", () => {
        expect(subject.isDeeplyFocused).to.be.true;
      });
    });

    describe("when no descendant suite or spec is focused", () => {
      beforeEach(() => {
        subject.describe("outer", s => {
          s.describe("inner 1", s2 => {
            s2.it("not focused for control sake").it("not focused for control sake");
          }).describe("inner 2", s2 => {
            s2.it("not focused for control sake").it("not focused for control sake");
          });
        });
      });

      it("should be false", () => {
        expect(subject.isDeeplyFocused).to.be.false;
      });
    })

    it("is read only", () => {
      subject.isDeeplyFocused = true;
    })
      .shouldFail()
      .rescue(reason => {
        expect(reason).to.be.instanceOf(TypeError);
      });
  });

  describe(".info(description)", () => {
    beforeAll(() => {
      expect(subject.specs).to.have.lengthOf(0);
    });

    const description = "this is a test";

    beforeEach(() => {
      subject.info(description);
    });

    it("should append a spec", () => {
      expect(subject.specs).to.have.lengthOf(1);
    });

    describe("the appended spec", () => {
      let spec;

      beforeEach(() => {
        [spec] = subject.specs;
      });

      it("should be skipped", () => {
        expect(spec.skipped).to.be.true;
      });

      it("should have the given description", () => {
        expect(spec.description).to.equal(description);
      });
    });
  });
});

describe("new Suite()", () => {
  it("should throw an error", () => {
    new Suite();
  })
    .shouldFail()
    .rescue(reason => {
      expect(reason.message).to.match(/required/);
    });
});

describe("new Suite(null)", () => {
  it("should work ok", () => {
    expect(new Suite(null).description).to.be.null;
  });
});

function noop() {}