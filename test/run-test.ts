import { expect } from "chai";
import { spy as createSpy } from "sinon";

async function* generate(_, sort) {
  const result = [1, 2, 3];

  sort(result);
  yield* result;
}

describe("the run helper", () => {
  describe("when an array of suites is passed", () => {
    let suites;

    beforeEach(() => {
      suites = [
        stable.describe(null).it("should run"),
        stable.describe(null).it("should run 2"),
        stable.describe(null).it("should run 3"),
      ];
    });

    it("should by default perform console.log", async () => {
      createSpy(console, "log");
      await stable.run(suites, { generate });
      expect(console.log.calledThrice).to.be.true;
      console.log.restore();
    });

    describe("passing an arbitrary effect", () => {
      let memo, perform;

      beforeEach(() => {
        memo = [];

        perform = report => {
          memo.push(report);
        };
      });

      it("should be possible to perform an aribtrary effect", async () => {
        await stable.run(suites, { generate, perform });
        expect(memo.sort((a, b) => a - b)).to.eql([1, 2, 3]);
      });

      it("should be possible to pass a sort algorithm", async () => {
        const sort = array => array.sort((a, b) => b - a);

        await stable.run(suites, { generate, perform, sort });
        expect(memo).to.eql([3, 2, 1]);
      });
    });

    describe("when called without options", () => {
      it("should default using to the reports generator");

      it("should by default perform console.log");
    });
  });

  describe("when a single suite is passed", () => {
    let suite;

    beforeEach(() => {
      suite = stable
        .describe(null)
        .it("should run")
        .it("should also run")
        .it("should run three");
    });

    it("should pull the specs out of the given generator", async () => {
      const spy = createSpy();

      await stable.run(suite, { perform: spy });
      expect(spy.calledThrice).to.be.true;
    });

    describe("when called without options", () => {
      it("should default using to the reports generator");

      it("should by default perform console.log", async () => {
        createSpy(console, "log");
        await stable.run(suite);
        expect(console.log.calledThrice).to.be.true;
        console.log.restore();
      });

      info(
        "it would be nice to have a story for testing sort is shuffle by default :thinking_face:",
      );
    });
  });
});
