import { describe } from "./stable";

const suites = [
  describe("describe", suite => {
    let subject;

    return suite
      .beforeEach(() => {
        subject = describe("subject");
      })

      .it("should have an `it` method", () => {
        assert(typeof subject.it === "function");
      })

      .it("should have an `run` method", () => {
        assert(typeof subject.run === "function");
      })

      .it("should have a `tap` method", () => {
        assert(typeof subject.tap === "function");
      })

      .describe("Suite#it", suite =>
        suite.it("should enqueue a spec", () => {
          assert(subject.specs.length === 0);
          subject.it("it", () => {});
          assert(subject.specs.length === 1);
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

            console.log(reports);
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

function assert(condition) {
  if (!condition) {
    throw new Error("Assertion error");
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
