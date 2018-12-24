export function flatMap(array, transform) {
  return array.reduce(
    (memo, item, index) => memo.concat(transform(item, index, array)),
    [],
  );
}
