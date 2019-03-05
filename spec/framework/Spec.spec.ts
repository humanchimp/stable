import { expect } from "chai";
import { Spec } from "../../src/framework/Spec";

let spec;

beforeEach(() => {
  spec = new Spec({
    description: "boring",
    test() {},
  });
});

it("meta should be blank by default", () => {
  expect(spec.meta).to.eql({});
});

describe(".timeout(number)", () => {
  it("should annotate meta.timeout", () => {
    spec.timeout(8000);
    expect(spec.meta).to.eql({ timeout: 8000 });
  });
});

describe(".shouldFail()", () => {
  it("should annotate meta.shouldFail", () => {
    spec.shouldFail();
    expect(spec.meta).to.eql({ shouldFail: true });
  });
});

describe(".rescue(rescuer)", () => {
  it("should annotate meta.rescuer", () => {
    function rescuer() {}
    spec.rescue(rescuer);
    expect(spec.meta).to.eql({ rescuer });
  });
});

describe(".info(infos)", () => {
  it("should accumulate meta.infos", () => {
    expect(spec.meta).to.eql({});
    spec.info("lala");
    expect(spec.meta).to.eql({ infos: ["lala"] });
    spec.info("baba");
    expect(spec.meta).to.eql({ infos: ["lala", "baba"] });
    spec.info("caca");
    expect(spec.meta).to.eql({ infos: ["lala", "baba", "caca"] });
  });
});
