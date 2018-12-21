import { Selection, describe as libDescribe } from "../lib/stable";
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
}, libDescribe(null));

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
      ([filter, desciptions]) => {
        it("should only run specs that match the description", () => {
          expect(
            filteredDescriptions(
              fixtureSuite,
              new Selection({ filter }).predicate,
            ),
          ).to.eql(desciptions);
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
      ([grepPattern, desciptions]) => {
        describe("when passed a string", () => {
          it("should only run specs that match the description", () => {
            expect(
              filteredDescriptions(
                fixtureSuite,
                new Selection({ grep: grepPattern }).predicate,
              ),
            ).to.eql(desciptions);
          });
        });

        describe("when passed a RegExp", () => {
          const grep = new RegExp(grepPattern);

          it("should only run specs that match the description", () => {
            expect(
              filteredDescriptions(
                fixtureSuite,
                new Selection({ grep }).predicate,
              ),
            ).to.eql(desciptions);
          });
        });
      },
    );
  });

  describe(".partition(total, partition, partitions)", () => {
    const specs = [...fixtureSuite.orderedSpecs()];
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
              new Selection().partition(total, partition, partitions),
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
        new Selection().partition(total, 7, 7);
      });
    });
  });
});

function filteredDescriptions(suite, predicate) {
  return [...suite.orderedSpecs()]
    .filter(predicate)
    .map(({ suite }) => suite.description);
}
