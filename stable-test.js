import chai from 'chai';

import { describe, run } from "./stable";

const { expect } = chai;

run([
  describe("describe", suite => {
    let subject;

    return suite
      .beforeEach(() => {
        subject = describe("subject");
      })

      .it("should have an `it` method", () => {
        expect(typeof subject.it).to.equal("function");
      })

      .it("should have a `run` method", () => {
        expect(typeof subject.run).to.equal("function");
      })

      .it("should have a `tap` method", () => {
        expect(typeof subject.tap).to.equal("function");
      })

      .describe("Suite#it", suite =>
        suite.it("should enqueue a spec", () => {
          expect(subject.specs).to.have.lengthOf(0);
          subject.it("it", () => {});
          expect(subject.specs).to.have.lengthOf(1);
        })
      )

      .describe("Suite#run", suite =>
        suite

          .beforeEach(() => {
            subject.it("a", () => {}).it("b", () => {});
          })

          .it("asynchronously yields reports", async () => {
            const reports = [];

            for await (const report of subject.run()) {
              reports.push(report);
            }

            expect(reports).to.eql([
              { description: 'subject a', reason: undefined, ok: true },
              { description: 'subject b', reason: undefined, ok: true }
            ]);
          })
      )
      .describe("Suite#tap", suite => {});
  })
]);

