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
    describe("when the array contains a single suite", () => {
      beforeEach(() => {
        subject = Suite.from([suites[0]]);
      });

      it("should return the suite itself", () => {
        expect(subject).to.equal(suites[0]);
      });
    });

    describe("when the array contains multiple suites", () => {
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
        subject
          .fdescribe("focused", noop)
          .describe("not focused for control sake", noop);
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
          s.fdescribe("focused", noop).describe(
            "not focused for control sake",
            noop,
          );
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
            s2.it("not focused for control sake").it(
              "not focused for control sake",
            );
          }).describe("inner 2", s2 => {
            s2.it("not focused for control sake").it(
              "not focused for control sake",
            );
          });
        });
      });

      it("should be false", () => {
        expect(subject.isDeeplyFocused).to.be.false;
      });
    });

    it("is read only", () => {
      subject.isDeeplyFocused = true;
    })
      .shouldFail()
      .rescue(reason => {
        expect(reason).to.be.instanceOf(TypeError);
      });
  });

  describeEach(
    "method signature which appends a spec",
    [
      [
        ".info(description)",
        desc => subject.info(desc),
        {
          skipped: true,
          focused: false,
          test: undefined,
        },
      ],
      [
        ".it(description)",
        desc => subject.it(desc),
        {
          skipped: true,
          focused: false,
          test: undefined,
        },
      ],
      [
        ".it(description, closure)",
        desc => subject.it(desc, noop),
        {
          skipped: false,
          focused: false,
          test: noop,
        },
      ],
      [
        ".xit(description)",
        desc => subject.xit(desc),
        {
          skipped: true,
          focused: false,
          test: undefined,
        },
      ],
      [
        ".xit(description, closure)",
        desc => subject.xit(desc, noop),
        {
          skipped: true,
          focused: false,
          test: noop,
        },
      ],
      [
        ".fit(description, thunk)",
        desc => subject.fit(desc, noop),
        {
          skipped: false,
          focused: true,
          test: noop,
        },
      ],
    ],
    ([signature, thunk, expected]) => {
      beforeEach(() => {
        expect(subject.specs).to.have.lengthOf(0);
      });

      const specDescription = `test case: ${signature}`;

      describe(signature, () => {
        beforeEach(() => {
          expect(thunk(specDescription), "it returns `this`").to.equal(subject);
        });

        it("should append a spec", () => {
          expect(subject.specs).to.have.lengthOf(1);
        });

        describe("the appended spec", () => {
          let spec;

          beforeEach(() => {
            [spec] = subject.specs;
          });

          it("should reflect skipped", () => {
            expect(spec.skipped).to.equal(expected.skipped);
          });

          it("should reflect focused", () => {
            expect(spec.focused).to.equal(expected.focused);
          });

          it("should have the given description", () => {
            expect(spec.description).to.equal(specDescription);
          });

          it("should have the given test, if any", () => {
            expect(spec.test).to.equal(expected.test);
          });
        });
      });
    },
  );

  describeEach(
    "method signature which appends a suite",
    [
      [
        ".describe(description, closure)",
        desc => subject.describe(desc, noop),
        {
          skipped: false,
          focused: false,
        },
      ],
      [
        ".xdescribe(description, closure)",
        desc => subject.xdescribe(desc, noop),
        {
          skipped: true,
          focused: false,
        },
      ],
      [
        ".fdescribe(description, closure)",
        desc => subject.fdescribe(desc, noop),
        {
          skipped: false,
          focused: true,
        },
      ],
      [
        ".describeEach(description, table, closure)",
        desc => subject.describeEach(desc, [1, 2, 3], noop),
        {
          skipped: false,
          focused: false,
        },
      ],
      [
        ".xdescribeEach(description, table, closure)",
        desc => subject.xdescribeEach(desc, [4, 5, 6], noop),
        {
          skipped: true,
          focused: false,
        },
      ],
      [
        ".fdescribeEach(description, table, closure)",
        desc => subject.fdescribeEach(desc, [9, 8, 7], noop),
        {
          skipped: false,
          focused: true,
        },
      ],
    ],
    ([signature, thunk, expected]) => {
      beforeEach(() => {
        expect(subject.suites).to.have.lengthOf(0);
      });

      const suiteDescription = `test case: ${signature}`;

      describe(signature, () => {
        beforeEach(() => {
          expect(thunk(suiteDescription), "it returns `this`").to.equal(
            subject,
          );
        });

        it("should append a spec", () => {
          expect(subject.suites).to.have.lengthOf(1);
        });

        describe("the appended suite", () => {
          let suite;

          beforeEach(() => {
            [suite] = subject.suites;
          });

          it("should reflect skipped", () => {
            expect(suite.skipped).to.equal(expected.skipped);
          });

          it("should reflect focused", () => {
            expect(suite.focused).to.equal(expected.focused);
          });

          it("should have the given description", () => {
            expect(suite.description).to.equal(suiteDescription);
          });
        });
      });
    },
  );

  const a = noop.bind(null);
  const b = noop.bind(null);

  describeEach("method signatures which append a hook", [
    [".beforeAll(hook)", 'beforeAll', [a, b]],
    [".afterAll(hook)", 'afterAll', [b, a]],
    [".beforeEach(hook)", 'beforeEach', [a, b]],
    [".afterEach(hook)", 'afterEach', [b, a]],
  ], ([signature, hook, expected]) => {
    describe(signature, () => {
      it("should appen the hooks in the correct order", () => {
        subject[hook](a);
        subject[hook](b);
        expect(subject.hooks[hook]).to.eql(expected);
      });
    });
  });

  describe(".orderedJobs()", () => {
    it("should return an iterator", () => {
      expect(typeof subject.orderedJobs().next).to.equal("function");
    });

    describeEach(
      "scenario",
      [
        [
          () =>
            subject
              .it("1")
              .it("2")
              .it("3"),
          () => [
            {
              suite: subject,
              spec: subject.specs[0],
              series: 0,
            },
            {
              suite: subject,
              spec: subject.specs[1],
              series: 1,
            },
            {
              suite: subject,
              spec: subject.specs[2],
              series: 2,
            },
          ],
        ],
        [
          () =>
            subject
              .describe("A", s =>
                s
                  .it("1")
                  .it("2")
                  .it("3"),
              )
              .describe("B", s =>
                s
                  .it("4")
                  .it("5")
                  .it("6"),
              )
              .it("7")
              .it("8")
              .it("9"),
          () => [
            {
              suite: subject,
              spec: subject.specs[0],
              series: 0,
            },
            {
              suite: subject,
              spec: subject.specs[1],
              series: 1,
            },
            {
              suite: subject,
              spec: subject.specs[2],
              series: 2,
            },
            {
              suite: subject.suites[0],
              spec: subject.suites[0].specs[0],
              series: 3,
            },
            {
              suite: subject.suites[0],
              spec: subject.suites[0].specs[1],
              series: 4,
            },
            {
              suite: subject.suites[0],
              spec: subject.suites[0].specs[2],
              series: 5,
            },
            {
              suite: subject.suites[1],
              spec: subject.suites[1].specs[0],
              series: 6,
            },
            {
              suite: subject.suites[1],
              spec: subject.suites[1].specs[1],
              series: 7,
            },
            {
              suite: subject.suites[1],
              spec: subject.suites[1].specs[2],
              series: 8,
            },
          ],
        ],
      ],
      ([precondition, expected]) => {
        beforeEach(precondition);

        it("should return the jobs in the expected order", () => {
          const expectedJobs = expected();

          for (const { suite, spec, series } of subject.orderedJobs()) {
            expect(suite).to.equal(expectedJobs[series].suite);
            expect(spec).to.equal(expectedJobs[series].spec);
          }
        });
      },
    );
  });

  describe(".andParents()", () => {
    it("should return an iterator", () => {
      expect(typeof subject.andParents().next).to.equal("function");
    });

    describe("when the suite has no parents", () => {
      it("should yield only itself", () => {
        expect([...subject.andParents()]).to.eql([subject]);
      });
    });

    describe("when the suite has parents", () => {
      let s1, s2, s3;

      beforeEach(() => {
        subject.describe(null, s => (s1 = s));
        s1.describe(null, s => (s2 = s));
        s2.describe(null, s => (s3 = s));
      });

      it("should yield the suite, followed by its parents in ascending order", () => {
        expect([...s3.andParents()]).to.eql([s3, s2, s1, subject]);
      });
    });
  });

  describe(".prefixed(description)", () => {
    describeEach(
      "scenario",
      [
        [new Suite("hi"), "hi milo"],
        [new Suite("good").describe("dog", noop).suites[0], "good dog milo"],
        [
          new Suite("roll")
            .describe("over", noop)
            .suites[0].describe("fetch", noop).suites[0],
          "roll over fetch milo",
        ],
      ],
      ([suite, expected]) => {
        it("should return a prefixed string", () => {
          expect(suite.prefixed("milo")).to.equal(expected);
        });
      },
    );
  });

  describeEach(
    "erroneous method signature",
    [
      [".info()", () => subject.info(), /required/],
      [".it()", () => subject.it(), /required/],
      [".xit()", () => subject.xit(), /required/],
      [".fit()", () => subject.fit(), /required/],
      [".fit(description)", () => subject.fit("hai"), /required/],
      [".beforeAll()", () => subject.beforeAll(), /required/],
      [".afterAll()", () => subject.afterAll(), /required/],
      [".beforeEach()", () => subject.beforeEach(), /required/],
      [".afterEach()", () => subject.afterEach(), /required/],
      [".describe()", () => subject.describe(), /required/],
      [".describe(description)", () => subject.describe("bonjour"), /required/],
      [".xdescribe()", () => subject.xdescribe(), /required/],
      [".xdescribe(description)", () => subject.describe("hola"), /required/],
      [".fdescribe()", () => subject.fdescribe(), /required/],
      [".fdescribe(description)", () => subject.fdescribe("caio"), /required/],
      [".describeEach()", () => subject.describeEach(), /required/],
      [
        ".describeEach(description)",
        () => subject.describe("aloha"),
        /required/,
      ],
      [
        ".describeEach(description, table)",
        () => subject.describeEach("zdravstvuyte", [1, 2, 3]),
        /required/,
      ],
      [".fdescribeEach()", () => subject.fdescribeEach(), /required/],
      [
        ".fdescribeEach(description)",
        () => subject.fdescribe("nǐn hǎo"),
        /required/,
      ],
      [
        ".fdescribeEach(description, table)",
        () => subject.fdescribeEach("konnichiwa", [1, 2, 3]),
        /required/,
      ],
      [".xdescribeEach()", () => subject.xdescribeEach(), /required/],
      [
        ".xdescribeEach(description)",
        () => subject.xdescribe("hallo"),
        /required/,
      ],
      [
        ".xdescribeEach(description, table)",
        () => subject.xdescribeEach("anyoung", [1, 2, 3]),
        /required/,
      ],
    ],
    ([signature, thunk, expectedErrorMessagePattern]) => {
      it(`should throw for the call of signature: ${signature}`, thunk)
        .shouldFail()
        .rescue(reason => {
          expect(reason.message).to.match(expectedErrorMessagePattern);
        });
    },
  );
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
