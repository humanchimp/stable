export function partitionRangeForTotal(total, partition, partitions) {
  const sizes = Array(partitions).fill(0);

  for (let i = 0; i < total; i++) {
    sizes[i % partitions]++;
  }

  const start = sizes
    .slice(0, partition)
    .reduce((memo, size) => memo + size, 0);
  const end = start + sizes[partition];

  return { start, end };
}
