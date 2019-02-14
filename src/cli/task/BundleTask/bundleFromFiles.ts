import { rollup } from "rollup";
import { isAbsolute } from "path";
import { readFile } from "fs-extra";
import babel from "@babel/core";
import multiEntry from "rollup-plugin-multi-entry";
import babelPluginIstanbul from "babel-plugin-istanbul";

export function bundleFromFiles({ files, plugins, shouldInstrument, verbose }) {
  return rollup({
    input: files,
    onwarn: verbose ? warning => console.warn(warning.message) : () => {},
    external(id) {
      if (["tslib"].includes(id)) {
        return false;
      }
      if (
        (id[0] !== "." && !isAbsolute(id)) ||
        id.slice(-5, id.length) === ".json"
      ) {
        const isExternal = plugins.every(
          plugin => plugin.resolveId == null || plugin.resolveId(id) == null,
        );

        return isExternal;
      }
      return false;
    },
    plugins: [
      ...plugins,
      ...(shouldInstrument
        ? [
            {
              name: "stable-instrument",
              async transform(code, id) {
                if (files.includes(id) || id[0] === "\x00") {
                  return;
                }

                let currentCode = await readFile(id, "utf-8");
                let currentMap = null;

                for (const { transform } of plugins.filter(
                  plugin => plugin.transform != null,
                )) {
                  const result = await transform(currentCode, id);

                  if (result == null) {
                    break;
                  }

                  ({ map: currentMap, code: currentCode } = result);
                }
                return babel.transform(code, {
                  filename: id,
                  sourceMaps: "inline",
                  plugins: [
                    [
                      babelPluginIstanbul,
                      {
                        include: ["src/**/*"],
                        inputSourceMap: currentMap,
                      },
                    ],
                  ],
                });
              },
            },
          ]
        : []),
      multiEntry(),
    ],
  });
}
