import { expect } from "chai";
import { getEntryfile } from "../../../src/cli/stablerc/getEntryfile";

describe("getEntryfile(cwd: string): Promise<string>", () => {
  it("should return the .stablerc for the cwd", async () => {
    expect(await getEntryfile("foo")).to.equal("foo/.stablerc");
  });
});

describe("getEntryfile(cwd: string, entry: string): Promise<string>", () => {
  describe("when entry is an absolute path to a directory", () => {
    it("should return the .stablerc relative to the absolute entry, ignoring the cwd", async () => {
      expect(await getEntryfile("foo", __dirname)).to.equal(
        `${__dirname}/.stablerc`,
      );
    });
  });

  describe("when entry is a relative path to a directory", () => {
    it("should return the .stablerc relative to entry relative to the cwd", async () => {
      expect(await getEntryfile(__dirname, "spec")).to.equal(
        `${__dirname}/spec/.stablerc`,
      );
    });
  });

  describe("when entry is a relative path to a .stablerc file", () => {
    it("should return the absolute path to the entry itself", async () => {
      expect(await getEntryfile(__dirname, "spec/.stablerc")).to.equal(
        `${__dirname}/spec/.stablerc`,
      );
    });
  });

  describe("when entry is a relative path to another file", () => {
    it("should return the absolute path to the nearest .stablerc file", async () => {
      expect(
        await getEntryfile(__dirname, "spec/cli/stablerc/getEntryfile.spec.ts"),
      ).to.equal(`${__dirname}/spec/cli/.stablerc`);
    });
  });
});
