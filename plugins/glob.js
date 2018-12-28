const path = require("path");
const lib = require("fast-glob");
const { readFile } = require("fs").promises;

export function glob({
  // The dirname is wrong: it is the dirname of the file that is importing this!
  root = path.join(path.dirname(__filename), "test"),
} = {}) {
  return {
    filename: __filename,
    helpers: {
      async glob(pattern) {
        const files = await lib(pattern, { cwd: root });

        return Promise.all(
          files.map(async file => ({
            file,
            contents: await readFile(path.join(root, file), "utf-8"),
          })),
        );
      },
    },
  };
}
