import { expect } from "chai";
import { spy, SinonSpy } from "sinon";
import { exhaust } from "../util/exhaust";
import { Suite } from "../../src/framework/Suite";
import {
  setupVconsole,
  virtualMethods,
  Vconsole,
} from "../../src/cli/task/RunTask/Vconsole";

describe("setupVconsole", () => {
  it("should mutate the global console object so it can intercept calls", async () => {
    const suite = new Suite(null).it("should log to the console", () => {
      console.log("this is a test");
    });
    const consoleSpy = spy();

    setupVconsole(suite, consoleSpy);

    await exhaust(suite.run());

    expect(consoleSpy.calledOnce).to.be.true;
  });
});

describe("new Vconsole()", () => {
  const memory = {},
    Console = {};
  let subject;

  beforeEach(() => {
    subject = new Vconsole({
      memory,
      Console,
    } as any);
  });

  describe(".memory", () => {
    it("should be passed through from the backing console", () => {
      expect(subject.memory).to.equal(memory);
    });
  });

  describe(".Console", () => {
    it("should be passed through from the backing console", () => {
      expect(subject.Console).to.equal(Console);
    });
  });

  describeEach("virtual method", virtualMethods, method => {
    it("should delegate to the method method", () => {
      const methodSpy = spy(subject, "method");

      subject[method]("oats", "hay");

      expect(methodSpy.calledOnce).to.be.true;
      expect(methodSpy.getCall(0).args).to.eql([method, ["oats", "hay"]]);
    });
  });

  describe(".addListener(event, listener)", () => {
    describe("for message events", () => {
      let listenerSpy: SinonSpy;

      beforeEach(() => {
        listenerSpy = spy();

        subject.addListener("message", listenerSpy);
      });

      it("should not call listener yet", () => {
        expect(listenerSpy.called).to.be.false;
      });

      it("should call the listener when a virtual method is invoked", () => {
        subject.log("test");
        expect(listenerSpy.calledOnce).to.be.true;
        expect(listenerSpy.getCall(0).args).to.eql([
          { console: { method: "log", arguments: ["test"] } },
        ]);
      });
    });

    describe("for any other event name", () => {
      it("should throw an error", () => {
        expect(() => {
          subject.addListener("contrived", () => {});
        }).to.throw(/unknown event name/);
      });
    });
  });

  describe(".removeListener(event, listener", () => {
    describe("for message events", () => {
      describe("when the listener is subscribed", () => {
        let listenerSpy;

        beforeEach(() => {
          listenerSpy = spy();
          subject.addListener("message", listenerSpy);
        });

        it("should remove it", () => {
          subject.removeListener("message", listenerSpy);
          subject.log("test");
          expect(listenerSpy.called).to.be.false;
        });
      });

      describe("when the listener is not subscribed", () => {
        it("should do nothing");
      });
    });

    describe("for any other event name", () => {
      it("should throw an error", () => {
        expect(() => {
          subject.removeListener("contrived", () => {});
        }).to.throw(/unknown event name/);
      });
    });
  });
});
