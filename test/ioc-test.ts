import { expect } from "chai";
import { asyncSpread } from "./util/asyncSpread";
import { getFixtures } from "./util/getFixtures";
import * as stable from "stable";

info("https://github.com/humanchimp/stable/issues/1");

describe("fixtures", async () => {
  const fixtures = await getFixtures("fixtures/**");

  describeEach(
    "expected reports generated from applications of the DSL",
    fixtures,
    ({ fixture, code, data: expectedReports }) => {
      it(`should return an asynchronous iterator over the sequential ${fixture} reports`, async () => {
        const suite = await stable.dsl({ code, helpers: { expect, sinon } });
        const reports = await asyncSpread(suite.reports(it => it));

        scrubReasons(reports);
        expect(reports).to.eql(expectedReports);
      });
    },
  );
});

describeEach(
  "cases that should not work",
  [
    [`fit("focusing a stub")`, /required/],
    [`fdescribe("suites aren't stubs")`, /required/],
  ],
  ([code, pattern]) => {
    it("should throw an error", async () => {
      await stable.dsl({ code });
    })
      .shouldFail()
      .rescue(reason => {
        expect(reason.message).to.match(pattern);
      });
  },
);

function scrubReasons(reports) {
  for (const report of reports) {
    if (report.reason != null) {
      report.reason = { message: report.reason.message };
    }
  }
}
