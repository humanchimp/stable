export async function asyncSpread(asyncIterator) {
  const collection = [];

  for await (const item of asyncIterator) {
    collection.push(item);
  }
  return collection;
}
