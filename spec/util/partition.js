export function partition(collection, predicate) {
  return collection.reduce(
    (memo, candidate) => {
      memo[1 - predicate(candidate)].push(candidate);
      return memo;
    },
    [[], []],
  );
}
