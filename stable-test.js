import chai from 'chai';
import { describe } from "./stable";

const { expect } = chai;

const suites = [
  describe("describe", suite => {
    let subject;

    return suite
      .beforeEach(() => {
        subject = describe("subject");
      })

      .it("should have an `it` method", () => {
        expect(typeof subject.it).to.equal("function");
      })

      .it("should have an `run` method", () => {
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
];

async function main() {
  for (const suite of shuffle(suites.slice())) {
    for await (const result of suite.tap()) {
      console.log(result);
    }
  }
}

main();

function shuffle(array) {
  var m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}
