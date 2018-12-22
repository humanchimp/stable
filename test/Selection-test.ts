import { flatMap } from "../src/flatMap";
import { partitionRangeForTotal } from "../src/partititionRangeForTotal";

const fixtureSuite = [
  "one fish",
  "two fish",
  "red fish",
  "blue fish",
  "this one has a little star",
  "this one has a little car",
].reduce((memo, description) => {
  memo.describe(description, suite => suite.it("stub"));
  return memo;
}, stable.describe(null));

describe("Selection", () => {
  describe(".predicate", () => {
    describeEach(
      "the filter option",
      [
        [
          "one",
          [
            "one fish",
            "this one has a little star",
            "this one has a little car",
          ],
        ],
        ["fish", ["one fish", "two fish", "red fish", "blue fish"]],
      ],
      ([filter, descriptions]) => {
        it("should only run specs that match the description", () => {
          expect(
            filteredDescriptions(
              fixtureSuite,
              new stable.Selection({ filter }).predicate,
            ),
          ).to.eql(descriptions);
        });
      },
    );

    describeEach(
      "the grep option",
      [
        [
          "one5?",
          [
            "one fish",
            "this one has a little star",
            "this one has a little car",
          ],
        ],
        ["(?:red|blue)", ["red fish", "blue fish"]],
      ],
      ([grepPattern, descriptions]) => {
        describe("when passed a string", () => {
          it("should only run specs that match the description", () => {
            expect(
              filteredDescriptions(
                fixtureSuite,
                new stable.Selection({ grep: grepPattern }).predicate,
              ),
            ).to.eql(descriptions);
          });
        });

        describe("when passed a RegExp", () => {
          const grep = new RegExp(grepPattern);

          it("should only run specs that match the description", () => {
            expect(
              filteredDescriptions(
                fixtureSuite,
                new stable.Selection({ grep }).predicate,
              ),
            ).to.eql(descriptions);
          });
        });
      },
    );
  });

  describe(".partition(total, partition, partitions)", () => {
    const specs = [...fixtureSuite.orderedJobs()];
    const { length: total } = specs;
    const table = flatMap(Array(total).fill(0), (_, i) =>
      Array(i)
        .fill(0)
        .map((_, ii) => [ii, i]),
    );

    describeEach(
      "reasonable paritioning schemes",
      table,
      ([partition, partitions]) => {
        it(`should partition the suites correctly for (${total}, ${partition}, ${partitions})`, () => {
          const { start, end } = partitionRangeForTotal(
            total,
            partition,
            partitions,
          );
          const batch = specs.slice(start, end);

          expect(
            specs.filter(
              new stable.Selection().partition(total, partition, partitions),
            ),
          ).to.eql(batch);
        });
      },
    );

    describe("when partitions == partitions", () => {
      it("should throw", () => {
        shouldFail();
        rescue(reason => {
          expect(reason).to.be.instanceOf(RangeError);
          expect(reason.message).to.match(
            /partition must be less than partitions/,
          );
        });
        new stable.Selection().partition(total, 7, 7);
      });
    });
  });
});

function filteredDescriptions(suite, predicate) {
  return [...suite.orderedJobs()]
    .filter(predicate)
    .map(({ suite }) => suite.description);
}
