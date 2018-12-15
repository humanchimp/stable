import { dsl } from "../src/dsl";
import { asyncSpread } from "./util/asyncSpread";
import { getFixtures } from "./util/getFixtures";

info("https://github.com/humanchimp/stable/issues/1");

describe("fixtures", async () => {
  const fixtures = await getFixtures("fixtures/**");

  it("should return an asynchronous iterator over the reports run sequentially", async () => {
    for (const { code, data: expectedReports } of fixtures) {
      const suite = await dsl({ code, helpers: { expect } });
      const reports = await asyncSpread(suite.reports(it => it));

      expect(reports).to.eql(expectedReports);
    }
  });
});

describeEach(
  "cases that should not work",
  [
    [`fit("focusing a stub")`, /required/],
    [`fdescribe("suites aren't stubs")`, /required/],
  ],
  ([code, pattern]) => {
    it("should throw an error", async () => {
      shouldFail();
      rescue(reason => {
        expect(reason.message).to.match(pattern);
      });
      await dsl({ code });
    });
  },
);
