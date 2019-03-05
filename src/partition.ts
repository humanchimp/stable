export function partition(collection, predicate) {
  return collection.reduce(
    (memo, candidate) => {
      memo[predicate(candidate) ? 0 : 1].push(candidate);
      return memo;
    },
    [[], []],
  );
}
