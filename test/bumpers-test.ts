import { expect } from "chai";
import * as stable from "stable";

describe("the `describe` factory", () => {
  info(`\
This test case is important because we want to make sure that the error we're \
checking for below is caused further downstream than the factory.`);

  it("should be callable with the explicit suite description `null`", () => {
    expect(stable.describe(null).description).to.equal(null);
  });
});

describeEach(
  "required parameters",
  [
    [
      "the `describe` factory",
      [["suite description", () => stable.describe()]],
    ],
    [
      "the `beforeAll` method",
      [["the hook", () => stable.describe(null).beforeAll()]],
    ],
    [
      "the `afterAll` method",
      [["the hook", () => stable.describe(null).afterAll()]],
    ],
    [
      "the `beforeEach` method",
      [["the hook", () => stable.describe(null).beforeEach()]],
    ],
    [
      "the `afterEach` method",
      [["the hook", () => stable.describe(null).afterEach()]],
    ],
    [
      "the `it` method",
      [["spec description", () => stable.describe(null).it()]],
    ],
    [
      "the `xit` method",
      [["suite description", () => stable.describe(null).xit()]],
    ],
    [
      "the `fit` method",
      [
        ["spec description", () => stable.describe(null).fit()],
        ["test case (closure)", () => stable.describe(null).fit("placeholder")],
      ],
    ],
    [
      "the `describe` method",
      [
        ["suite description", () => stable.describe(null).describe()],
        [
          "describe initializer (closure)",
          () => stable.describe(null).describe("placeholder"),
        ],
      ],
    ],
    [
      "the `fdescribe` method",
      [
        ["suite description", () => stable.describe(null).fdescribe()],
        [
          "describe initializer (closure)",
          () => stable.describe(null).fdescribe("placeholder"),
        ],
      ],
    ],
    [
      "the `xdescribe` method",
      [
        ["suite description", () => stable.describe(null).xdescribe()],
        [
          "describe initializer (closure)",
          () => stable.describe(null).xdescribe("placeholder"),
        ],
      ],
    ],
    [
      "the `describeEach` method",
      [
        ["suite description", () => stable.describe(null).describeEach()],
        ["table", () => stable.describe(null).describeEach("placeholder")],
        [
          "describe initializer (closure)",
          () => stable.describe(null).describeEach("placeholder", []),
        ],
      ],
    ],
    [
      "the `xdescribeEach` method",
      [
        ["suite description", () => stable.describe(null).xdescribeEach()],
        ["table", () => stable.describe(null).xdescribeEach("placeholder")],
        [
          "describe initializer (closure)",
          () => stable.describe(null).xdescribeEach("placeholder", []),
        ],
      ],
    ],
    [
      "the `fdescribeEach` method",
      [
        ["suite description", () => stable.describe(null).fdescribeEach()],
        ["table", () => stable.describe(null).fdescribeEach("placeholder")],
        [
          "describe initializer (closure)",
          () => stable.describe(null).fdescribeEach("placeholder", []),
        ],
      ],
    ],
  ],
  ([suiteDesciption, cases]) => {
    describeEach(suiteDesciption, cases, ([specDescription, thunk]) => {
      it(`requires a parameter that must be provided: ${specDescription}`, () => {
        shouldFail();
        rescue(reason => {
          expect(reason.message).to.match(/required/);
        });
        thunk();
      });
    });
  },
);
