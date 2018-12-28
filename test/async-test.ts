import { expect } from "chai";

it("should handle async functions", async () => {
  await delay(10);
  expect(true).to.equal(true);
});

it("should be possible to set a timeout for an individual spec", async () => {
  await delay(600);
})
  .timeout(500)
  .shouldFail()
  .rescue(reason => {
    expect(reason.message).to.match(/Timeout/);
  });

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
