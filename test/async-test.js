it("should handle async functions", async () => {
  await delay(10);
  expect(true).to.equal(true);
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
