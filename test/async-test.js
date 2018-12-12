it("should handle async functions", async () => {
  await delay(10);
  expect(true).to.equal(true);
});

it("should be possible to set a timeout for an individual spec", async () => {
  timeout(500);
  shouldFail();
  rescue(reason => {
    expect(() => {
      throw reason;
    }).to.throw(/Timeout/);
  });
  await delay(600);
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
