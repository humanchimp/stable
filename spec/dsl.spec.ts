import { expect } from "chai";
import { asyncSpread } from "./util/asyncSpread";
import { getFixtures } from "./util/getFixtures";
import * as stable from "../src/lib";

info("https://github.com/humanchimp/stable/issues/1");

describe("fixtures", () => {
  const fixtures = getFixtures();

  describeEach(
    "expected reports generated from applications of the DSL",
    fixtures,
    ({ fixture, code, data: expectedReports }) => {
      it(`should return an asynchronous iterator over the sequential ${fixture} reports`, async () => {
        const suite = await stable.dsl({ code, helpers: { expect } });
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
    [`describeEach("describe each requires a table")`, /required/],
    // [`describe.each("describeEach requires a closure", [])`, /required/],
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
