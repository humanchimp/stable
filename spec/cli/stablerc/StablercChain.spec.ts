import { expect } from "chai";
import {
  StablercChain,
  loadAll,
} from "../../../src/cli/stablerc/StablercChain";
import { StablercChainParams } from "../../../src/cli/interfaces";
import { load } from "../../../src/cli/stablerc/StablercChain";
import { file, dir, FileResult, DirectoryResult } from "tmp-promise";
import { write } from "fs-extra";

let subject: StablercChain;

afterEach(() => {
  subject = undefined;
});

describeEach(
  "new StablercChain()",
  [
    [undefined, { inheritance: [], plugins: false }],
    [{}, { inheritance: [], plugins: false }],
    [{ inheritance: [] }, { inheritance: [], plugins: false }],
    [{ inheritance: [], plugins: false }, { inheritance: [], plugins: false }],
    [{ plugins: false }, { inheritance: [], plugins: false }],
    [{ plugins: true }, { inheritance: [], plugins: true }],
  ] as StablercChainParams[][],
  ([params, expected]) => {
    beforeEach(() => {
      subject = new StablercChain(params);
    });

    it("should be an instanceof StablercChain", () => {
      expect(subject).to.be.an.instanceOf(StablercChain);
    });

    describe(".plugins", () => {
      it("should be a boolean", () => {
        expect(typeof subject.plugins).to.equal("boolean");
      });

      it("should correspond to its parameter", () => {
        expect(subject.plugins).to.equal(expected.plugins);
      });
    });
  },
);

describe("load(filename: string)", () => {
  beforeEach(async () => {
    subject = await load(".stablerc");
  });

  it("should load the inheritance chain", () => {
    console.log(subject);
  });
});

describe("load(filename: string, params: StablercFileLoadParams)", () => {
  it("should load the inheritance chain");
});

describe("load(filename: string, params: StablercFileLoadParams, files: StablercFile[])", () => {
  it("should load the inheritance chain");
});

describe("loadAll(filename: string)", () => {
  let map: Map<string, StablercChain>;

  beforeEach(async () => {
    map = await loadAll(".stablerc");
  });

  it("should work", () => {
    console.log(map);
  });
});

describe(".flat(): StablercFile", () => {
  beforeEach(async () => {
    subject = await load("spec/cli/.stablerc");
  });

  it("should flatten the chain to a StablercFile", () => {
    const flat = subject.flat();

    expect(flat.document.include).to.eql(["./**.spec.ts"]);
    expect(flat.document.plugins).to.eql([
      ["timing", { timeout: 500 }],
      ["rescue"],
      ["fixture", { include: ["spec/fixture/**/*"] }],
    ]);
  });
});

describe("inheritance using absolute paths", () => {
  let tmpdir: DirectoryResult, subject: StablercChain;

  beforeEach(async () => {
    tmpdir = await dir({ dir: __dirname, unsafeCleanup: true });

    const base: FileResult = await file({
      postfix: ".stablerc",
      dir: tmpdir.path,
    });
    const child: FileResult = await file({
      postfix: ".stablerc",
      dir: tmpdir.path,
    });

    await write(base.fd, `runners: ['isolate']`, "utf-8");
    await write(child.fd, `extends: ${base.path}`, "utf-8");
    subject = await StablercChain.load(child.path);
  });

  afterEach(async () => {
    await tmpdir.cleanup();
  });

  it("should work", () => {
    console.log("subject", subject);
  });
});
