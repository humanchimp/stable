import { expect } from "chai";
import { loadModule } from "../../src/cli/loadModule";
import { file, FileResult, dir, DirectoryResult } from "tmp-promise";
import { write } from "fs-extra";

let tmpdir: DirectoryResult, fileA: FileResult, fileB: FileResult;

beforeEach(async () => {
  tmpdir = await dir({ dir: __dirname, unsafeCleanup: true });
  fileA = await file({ postfix: ".js", dir: tmpdir.path });
  fileB = await file({ postfix: ".js", dir: tmpdir.path });

  await write(
    fileA.fd,
    `const t = require("${fileB.path}");
export default t;
`,
    "utf-8",
  );
  await write(fileB.fd, "module.exports = 42", "utf-8");
});

afterEach(async () => {
  await tmpdir.cleanup();
});

it("should load asynchronously an ES module into memory as though it were require'd", async () => {
  expect(await loadModule(fileA.path)).to.equal(42);
});
