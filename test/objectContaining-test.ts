describe("objectContaining plugin", () => {
  it("should match partially, but deeply", () => {
    expect({ foo: { bar: 42 }, baz: { qux: 42 } }).to.match(
      objectContaining({
        foo: {
          bar: 42,
        },
      }),
    );
  });

  it("shouldn't work backwards", () => {
    expect({
      foo: {
        bar: 42,
      },
    }).not.to.match(objectContaining({ foo: { bar: 42 }, baz: { qux: 42 } }));
  });

  it("should fail when the object doesn't match", () => {
    expect({ foo: 42, bar: 42 }).not.to.match(
      objectContaining({
        bar: 128,
      }),
    );
  });
});
