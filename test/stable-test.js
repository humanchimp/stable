import stable from "../lib/stable";
import { asyncSpread } from "./util/asyncSpread";

let subject;

describe("group", () => {
  describe("instance methods", () => {
    beforeEach(() => {
      subject = stable.describe("subject");
    });

    it("should have an `it` method", () => {
      expect(typeof subject.it).to.equal("function");
    });

    it("should have a `reports` method", () => {
      expect(typeof subject.reports).to.equal("function");
    });

    describe("Suite#it", () =>
      it("should enqueue a spec", () => {
        expect(subject.specs).to.have.lengthOf(0);
        subject.it("it", () => {});
        expect(subject.specs).to.have.lengthOf(1);
      }));

    describe("Suite#reports", () => {
      beforeEach(() => {
        subject.it("a", () => {}).it("b", () => {});
      });

      it("asynchronously yields reports", async () => {
        expect(await asyncSpread(subject.reports(it => it))).to.eql([
          { description: "subject a", ok: true },
          { description: "subject b", ok: true },
        ]);
      });
    });

    describe("Suite#xdescribe", suite => {
      beforeEach(() => {
        subject.xdescribe("xdescribe", s1 =>
          s1
            .it("should pass", () => {})
            .it("should fail", () => {
              expect(true).to.be.false;
            })
            .describe("inner suite", s2 =>
              s2
                .it("should pass", () => {})
                .it("should fail", () => {
                  expect(true).to.be.false;
                })
                .xit("would pass")
                .xit("would fail"),
            ),
        );
      });

      it("should skip all the specs all the way down, turtle-wise", async () => {
        expect(await asyncSpread(subject.reports(it => it))).to.eql([
          {
            description: "subject xdescribe should pass",
            ok: true,
            skipped: true,
          },
          {
            description: "subject xdescribe should fail",
            ok: true,
            skipped: true,
          },
          {
            description: "subject xdescribe inner suite should pass",
            ok: true,
            skipped: true,
          },
          {
            description: "subject xdescribe inner suite should fail",
            ok: true,
            skipped: true,
          },
          {
            description: "subject xdescribe inner suite would pass",
            ok: true,
            skipped: true,
          },
          {
            description: "subject xdescribe inner suite would fail",
            ok: true,
            skipped: true,
          },
        ]);
      });
    });
  });

  describe("the imperative suite factory", () => {
    let spy;

    describe("when a closure is passed", () => {
      beforeEach(() => {
        spy = sinon.spy();
        subject = stable.describe("test", spy);
      });

      it("should execute the closure immediately", () => {
        expect(stable).not.to.be.null;
        expect(spy.calledOnce).to.be.true;
      });
    });
  });
});
