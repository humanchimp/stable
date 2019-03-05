import babel from "@babel/core";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import t from "@babel/types";
import { partition } from "../../../partition";

const names = [
  "describe",
  "xdescribe",
  "fdescribe",
  "describeEach",
  "xdescribeEach",
  "fdescribeEach",
  "it",
  "xit",
  "fit",
  "beforeAll",
  "afterAll",
  "beforeEach",
  "afterEach",
  "info",
];

export function thunkify({ files }) {
  return {
    name: "stable-thunkify",
    transform(code, filename) {
      if (!files.some(file => filename === file)) {
        return;
      }
      const ast = babel.parse(code, { filename });

      traverse(ast, {
        Program(path) {
          const [imports, rest] = partition(path.node.body, node =>
            ["ImportDeclaration"].includes(node.type),
          );
          if (rest.length > 1 || !t.isExportNamedDeclaration(rest[0])) {
            path.replaceWith(
              t.program([
                ...imports,
                t.exportNamedDeclaration(
                  t.functionDeclaration(
                    t.identifier("thunk"),
                    names.map(name => t.identifier(name)),
                    t.blockStatement(rest),
                  ),
                  [],
                ),
              ]),
            );
          }
        },
      });

      return generate(
        ast,
        { sourceMaps: true, sourceFileName: filename },
        code,
      );
    },
  };
}
