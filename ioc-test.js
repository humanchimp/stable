import chai from "chai";

import { describe, run } from "./stable";
import { ioc } from "./ioc";
import { asyncSpread } from "./asyncSpread";

const { expect } = chai;

export const iocSuite = describe("ioc", suite =>
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
        ],
        [
          `
describe('skipping failed tests', () => {
  xit('should work', () => {
    throw new Error();
  });

  xit('should work', () => {
    throw new Error();
  });

  describe('a nested suite', () => {
    xit('should work', () => {
      throw new Error();
    });
  });

  xdescribe('a skipped suite', () => {
    it("should work", () => {
      throw new Error();
    });
  });
});
`,
          [
            {
              description: "skipping failed tests should work",
              ok: true,
              skipped: true
            },
            {
              description: "skipping failed tests should work",
              ok: true,
              skipped: true
            },
            {
              description: "skipping failed tests a nested suite should work",
              ok: true,
              skipped: true
            },
            {
              description: "skipping failed tests a skipped suite should work",
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
            expect(await asyncSpread(ioc(code).reports(it => it))).to.eql(
              reports
            );
          }
        );
      }
    ));

