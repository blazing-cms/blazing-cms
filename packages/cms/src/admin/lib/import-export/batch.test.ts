import { describe, expect, it } from "vitest";

import { partitionWrites } from "./batch";

describe("partitionWrites", () => {
  it("returns no chunks for empty input", () => {
    expect(partitionWrites([], 500)).toEqual([]);
  });

  it("keeps a single under-limit chunk intact", () => {
    const items = Array.from({ length: 3 }, (_, i) => i);
    expect(partitionWrites(items, 500)).toEqual([[0, 1, 2]]);
  });

  it("preserves order across exactly-sized chunks", () => {
    const items = Array.from({ length: 500 }, (_, i) => i);
    const chunks = partitionWrites(items, 500);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(500);
    expect(chunks[0]![0]).toBe(0);
    expect(chunks[0]![499]).toBe(499);
  });

  it("splits a 501-item list into 500 + 1", () => {
    const items = Array.from({ length: 501 }, (_, i) => i);
    const chunks = partitionWrites(items, 500);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(500);
    expect(chunks[1]).toHaveLength(1);
    expect(chunks[1]![0]).toBe(500);
  });

  it("splits a large list into sequential batches of at most the limit", () => {
    const items = Array.from({ length: 1003 }, (_, i) => i);
    const chunks = partitionWrites(items, 500);
    expect(chunks.map((c) => c.length)).toEqual([500, 500, 3]);
    expect(chunks.every((c) => c.length <= 500)).toBe(true);
    expect(chunks.flat()).toEqual(items);
  });
});
