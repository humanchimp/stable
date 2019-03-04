/// <stable runner="headless chrome" />
/// <stable runner="jsdom" />
import { expect } from "chai";
import { Sock } from "../../../src/runners/remote/Sock";

describe("Sock", () => {
  let subject: Sock;

  beforeEach(() => {
    subject = new Sock("ws://example.com/ws");
  });

  it("should be an instance of WebSocket", () => {
    expect(subject).to.be.instanceOf(WebSocket);
  });

  it("should close straightaway currently because there is no server and this is not an end to end test", () =>
    new Promise(resolve => {
      subject.addEventListener("close", resolve, { once: true });
    }));
});
