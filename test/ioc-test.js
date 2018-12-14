import { ioc } from "../src/ioc";
import { asyncSpread } from "../src/asyncSpread";

info("https://github.com/humanchimp/stable/issues/1");

describeEach(
  "cases that should work",
  [
    [
      `
describe('info annotations', () => {
  info("https://www.example.com");
  info("/relative.html");
  info("mailto:christopherthorn82@gmail.com");
});
`,
      [
        {
          description:
            "info annotations See https://www.example.com/ for more information",
          ok: true,
          skipped: true,
        },
        {
          description: "info annotations /relative.html",
          ok: true,
          skipped: true,
        },
        {
          description: "info annotations mailto:christopherthorn82@gmail.com",
          ok: true,
          skipped: true,
        },
      ],
    ],
    [
      `
describe('stubs', () => {
  it("should be possible to have a stub");
  xit("it should be possible to skip a stub");
});
`,
      [
        {
          description: "stubs should be possible to have a stub",
          ok: true,
          skipped: true,
        },
        {
          description: "stubs it should be possible to skip a stub",
          ok: true,
          skipped: true,
        },
      ],
    ],
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
          skipped: true,
        },
        {
          description: "a test suite a feature should work well",
          ok: true,
          skipped: true,
        },
      ],
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
          skipped: true,
        },
        {
          description: "skipping failed tests should work",
          ok: true,
          skipped: true,
        },
        {
          description: "skipping failed tests a nested suite should work",
          ok: true,
          skipped: true,
        },
        {
          description: "skipping failed tests a skipped suite should work",
          ok: true,
          skipped: true,
        },
      ],
    ],
    [
      `
const memo = [];

describe('hooks', () => {
  beforeAll(() => {
    memo.push('before all');
  });

  afterAll(() => {
    memo.push('after all');
  });

  beforeEach(() => {
    memo.push('before each');
  });

  afterEach(() => {
    memo.push('after each');
  });

  it("spec 1", () => {
    memo.push('spec 1');
  });

  it("spec 2", () => {
    memo.push('spec 2');
  });
});

describe("accumulation", () => {
  it("should have run the hooks in the correct order", () => {
    expect(memo).to.eql([
      "before all",
      "before each",
      "spec 1",
      "after each",
      "before each",
      "spec 2",
      "after each",
      "after all",
    ]);
  })
});
`,
      [
        { description: "hooks spec 1", ok: true },
        { description: "hooks spec 2", ok: true },
        {
          description:
            "accumulation should have run the hooks in the correct order",
          ok: true,
        },
      ],
    ],
  ],
  ([code, reports]) => {
    it("should return an asynchronous iterator over the reports run sequentially", async () => {
      const suite = ioc({ code, helpers: { expect } });

      expect(
        await asyncSpread(suite.reports(it => it))
      ).to.eql(reports);
    });
  },
);

describeEach(
  "cases that should not work",
  [
    [`fit("focusing a stub")`, /required/],
    [`fdescribe("suites aren't stubs")`, /required/],
  ],
  ([code, pattern]) => {
    it("should throw an error", () => {
      shouldFail();
      rescue(reason => {
        expect(reason.message).to.match(pattern);
      });
      ioc({ code });
    });
  },
);
