import chai from "chai";

import { describe, run } from "./stable";

const { expect } = chai;

export const main = describe("describe", suite => {
  let subject;

  return suite
    .beforeEach(() => {
      subject = describe("subject");
    })

    .it("should have an `it` method", () => {
      expect(typeof subject.it).to.equal("function");
    })

    .it("should have a `reports` method", () => {
      expect(typeof subject.reports).to.equal("function");
    })

    .describe("Suite#it", suite =>
      suite.it("should enqueue a spec", () => {
        expect(subject.specs).to.have.lengthOf(0);
        subject.it("it", () => {});
        expect(subject.specs).to.have.lengthOf(1);
      })
    )

    .describe("Suite#reports", suite =>
      suite

        .beforeEach(() => {
          subject.it("a", () => {}).it("b", () => {});
        })

        .it("asynchronously yields reports", async () => {
          const reports = [];

          for await (const report of subject.reports()) {
            reports.push(report);
          }

          expect(reports).to.eql([
            { description: "subject a", reason: undefined, ok: true },
            { description: "subject b", reason: undefined, ok: true }
          ]);
        })
    )

    .describe("Suite#tap", suite => {})

    .describeEach(
      "table row",
      [[1, 2, 3], [1, 2, 3], [1, 2, 4], [1, 2, 3], [1, 2, 3]],
      (suite, [a, b, c]) =>
        suite
          .info("https://www.github.com/humanchimp/stable/issues/1")

          .it("should start with 1", () => {
            expect(a).to.equal(1);
          })

          .it("should proceed with 2", () => {
            expect(b).to.equal(2);
          })

          .it("should end with 3", () => {
            expect(c).to.equal(3);
          })
    );
});
