import chai from "chai";

const { expect } = chai;

describe("the ioc framework", () => {
  it("should work more or less like mocha or jasmine or jest", () => {
    expect(true).to.be.true;
  });

  describe("nested suites", () => {
    info("https://github.com/humanchimp/stable/issues/1");

    describe("first nested suite", () => {
      it("should work as normal", () => {
        expect(true).to.be.true;
      });
    });

    describe("second nested suite", () => {
      xit("should be possible to skip a failed test", () => {
        expect(false).to.be.true;
      });

      it("should be possible to fail tests too", () => {
        expect(true).to.be.true;
      });
    });

    xdescribe("third nested suite", () => {
      it("should be possible to skip an entire suite", () => {
        expect(false).to.be.true;
      });

      describe("skipness should propagate downward, turtle-wise", () => {
        it("would normally fail but won't run because it's been skipped", () => {
          expect(false).to.be.true;
        });

        it("would normally pass but won't run because it's been skipped", () => {
          expect(true).to.be.true;
        });
      });
    });
  });
});
