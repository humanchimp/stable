import { expect } from "chai";

describe("the reports helper", () => {
  it("should return an asynchronous iterator over the suite reports", async () => {
    for await (const report of stable.reports([
      stable.describe("first suite").it("should run"),
      stable.describe("second suite").it("should run"),
    ])) {
      expect(report.description).to.match(/should run/);
      expect(report.skipped).to.be.true;
      expect(report.ok).to.be.true;
    }
  });

  it("should splat and run a single suite", async () => {
    for await (const report of stable.reports(
      stable.describe("first suite").it("should run"),
    )) {
      expect(report.description).to.match(/should run/);
      expect(report.skipped).to.be.true;
      expect(report.ok).to.be.true;
    }
  });

  it("should be possible to specify the sort", async () => {
    const memo = [];

    for await (const report of stable.reports(
      [
        stable
          .describe(null)
          .it("l")
          .it("m")
          .it("n")
          .it("o")
          .it("p"),
        stable
          .describe(null)
          .it("z")
          .it("y")
          .it("x")
          .it("w")
          .it("v"),
        stable
          .describe(null)
          .it("a")
          .it("b")
          .it("c")
          .it("d")
          .it("e"),
      ],
      array =>
        array.sort((a, b) =>
          a.spec.description.localeCompare(b.spec.description),
        ),
    )) {
      memo.push(report.description);
    }
    expect(memo).to.eql([
      "a",
      "b",
      "c",
      "d",
      "e",
      "l",
      "m",
      "n",
      "o",
      "p",
      "v",
      "w",
      "x",
      "y",
      "z",
    ]);
  });
});
