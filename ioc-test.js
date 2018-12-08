import chai from "chai";

import { describe, run } from "./stable";
import { ioc } from "./ioc";

const { expect } = chai;

run([
  describe("ioc", suite =>
    suite
      .info("https://github.com/humanchimp/stable/issues/1")

      .describeEach(
        "test cases",
        [
          [
            `
describe('a test suite', () => {
  describe('a feature', () => {
    xit('should work');

    xit('should work well');
  });
});
`,
            [
              {
                description: "a test suite a feature should work",
                ok: true,
                skipped: true
              },
              {
                description: "a test suite a feature should work well",
                ok: true,
                skipped: true
              }
            ]
          ]
        ],
        (suite, [code, reports]) => {
          suite.it(
            "should return an asynchronous iterator over the reports run sequentially",
            async () => {
              expect(await asyncSpread(ioc(code).reports())).to.eql(reports);
            }
          );
        }
      ))
]);

async function asyncSpread(asyncIterator) {
  const collection = [];

  for await (const item of asyncIterator) {
    collection.push(item);
  }
  return collection;
}
