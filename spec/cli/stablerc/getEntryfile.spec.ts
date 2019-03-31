import { expect } from "chai";
import { getEntryfile } from "../../../src/cli/stablerc/getEntryfile";

describe("getEntryfile(file: string): Promise<string>", () => {
  it("should return a .stablerc itself", async () => {
    expect(await getEntryfile(".stablerc.yml")).to.equal(".stablerc.yml");
    expect(await getEntryfile("spec/.stablerc.yml")).to.equal(
      "spec/.stablerc.yml",
    );
  });

  it("should return the .stablerc for the directory", async () => {
    expect(await getEntryfile("spec")).to.equal("spec/.stablerc.yml");
  });

  it("should return the .stablerc for a spec", async () => {
    expect(await getEntryfile("spec/framework/Suite.spec.ts")).to.equal(
      "spec/framework/.stablerc.yml",
    );
  });

  it("should throw an error for a non-existent path in the case of a directory", async () => {
    await getEntryfile("jlkjkljk").catch(reason => {
      expect(reason.code).to.equal("ENOENT");
    });
  });

  it("should throw an error for a non-existent path in the case of a .stablerc", async () => {
    await getEntryfile("jlkjkljk/.stablerc").catch(reason => {
      expect(reason.code).to.equal("ENOENT");
    });
  });
});
