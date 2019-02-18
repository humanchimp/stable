import { expect } from "chai";
import { nearestStablerc } from "../../../src/cli/stablerc/nearestStablerc";
import { dir, DirectoryResult } from "tmp-promise";
import { mkdirp, ensureFile } from "fs-extra";
import { join } from "path";

let tmpdir: DirectoryResult;

beforeEach(async () => {
  tmpdir = await dir({ dir: __dirname, unsafeCleanup: true });
});

afterEach(async () => {
  await tmpdir.cleanup();
});

describe("nearestStablerc(dir: string): Promise<string>", () => {
  describe("when dir is a .stablerc", () => {
    let stablerc: string;

    beforeEach(async () => {
      stablerc = join(tmpdir.path, ".stablerc");
      await ensureFile(stablerc);
    });

    it("should return a promise of its input", async () => {
      expect(await nearestStablerc(stablerc)).to.equal(stablerc);
    });
  });

  describe("when dir contains a .stablerc", () => {
    let stablerc: string, spec: string;

    beforeEach(async () => {
      tmpdir = await dir({ dir: __dirname, unsafeCleanup: true });
      stablerc = join(tmpdir.path, ".stablerc");
      spec = join(tmpdir.path, "foo.js");
      await ensureFile(stablerc);
      await ensureFile(spec);
    });

    it("should return a promise of that .stablerc", async () => {
      expect(await nearestStablerc(spec)).to.equal(stablerc);
    });
  });

  describe("when the dir does not contain a .stablerc", () => {
    info("a child directory containing a .stablerc is irrelevant");

    describe("when the parent directory contains a .stablerc", () => {
      let stablerc: string, spec: string;

      beforeEach(async () => {
        stablerc = join(tmpdir.path, ".stablerc");
        await ensureFile(stablerc);

        const child = join(tmpdir.path, "child");

        spec = join(child, "foo.js");
        await mkdirp(child);
        await ensureFile(spec);
      });

      it("should return a promise of that .stablerc", async () => {
        expect(await nearestStablerc(spec)).to.equal(stablerc);
      });
    });

    describe("when an ancestor directory contains a .stablerc", () => {
      let stablerc: string, spec: string;

      beforeEach(async () => {
        stablerc = join(tmpdir.path, ".stablerc");
        await ensureFile(stablerc);

        const child = join(tmpdir.path, "first/second");

        spec = join(child, "foo.js");
        await mkdirp(child);
        await ensureFile(spec);
      });

      describe("when there is only one", () => {
        it("should return a promise of that .stablerc", async () => {
          expect(await nearestStablerc(spec)).to.equal(stablerc);
        });
      });

      describe("when there are multiple", () => {
        let closerOne: string;

        beforeEach(async () => {
          closerOne = join(tmpdir.path, "first", ".stablerc");
          await ensureFile(closerOne);
        });

        it("should return a promise of the nearest .stablerc", async () => {
          expect(await nearestStablerc(spec)).to.equal(closerOne);
        });
      });
    });

    describe("when no ancestor directory contains a .stablerc", () => {
      it("should return a promise of void", async () => {
        expect(await nearestStablerc("/dev/null")).to.be.undefined;
      });
    });
  });
});
