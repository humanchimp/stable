import glob from "fast-glob";
import virtual from "rollup-plugin-virtual";
import packageJson from "./package.json";
import { readFile } from "fs-extra";
import { dirname, join } from "path";

export async function fixture(options) {
  options = [].concat(options).pop(); // TODO: handle multiple options hashes

  const { include, exclude, module: moduleName = "fixture", stablerc } = options;

  const cwd = stablerc == null ? process.cwd() : dirname(stablerc);

  const files = await glob(include, { cwd });

  const fixtureData = await Promise.all(
    files.map(async file => {
      return {
        file,
        contents: await readFile(join(cwd, file), "utf-8"),
      };
    }),
  );

  const fixtureModule = `${files
    .map(
      file =>
        `import ${mangle(file)} from ${JSON.stringify(`fixture:${file}`)}`,
    )
    .join(";\n")}
export default {
${files.map(it => `  ${JSON.stringify(it)}: ${mangle(it)}`).join(",\n")}
};`;

  return {
    package: packageJson,

    provides: {
      plugins() {
        return [
          virtual({
            [moduleName]: fixtureModule,
          }),
          ...fixtureData.map(({ file, contents }) =>
            virtual({
              [`fixture:${file}`]: `export default ${JSON.stringify(contents)}`,
            }),
          ),
        ];
      },
    },
  };
}

function mangle(str) {
  return `_${str.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}
