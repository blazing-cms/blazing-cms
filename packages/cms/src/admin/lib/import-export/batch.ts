/** Partition items into sequential chunks of at most `batchLimit` items. */
export function partitionWrites<T>(items: T[], batchLimit: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += batchLimit) {
    chunks.push(items.slice(i, i + batchLimit));
  }
  return chunks;
}
