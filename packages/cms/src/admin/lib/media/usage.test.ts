import { describe, expect, it } from "vitest";

import type { DataProvider } from "@/lib/providers/types";

import { findMediaUsage } from "@/lib/media/usage";

const TARGET = "https://cdn.example.com/hero.jpg";

function makeProvider(
  docsBySlug: Record<string, Array<Record<string, unknown>>>,
  globalDoc: Record<string, unknown> | null,
): DataProvider {
  return {
    findMany: async (slug: string) => ({ data: docsBySlug[slug] ?? [], hasMore: false }),
    getGlobal: async () => globalDoc,
  } as unknown as DataProvider;
}

describe("findMediaUsage", () => {
  it("finds a reference across collections", async () => {
    const provider = makeProvider({ posts: [{ cover: TARGET, id: "p1", title: "Hello" }] }, null);
    const usage = await findMediaUsage(provider, TARGET);
    expect(usage).toEqual([{ collection: "posts", entryId: "p1", field: "cover", title: "Hello" }]);
  });

  it("finds references nested in arrays and objects", async () => {
    const provider = makeProvider(
      { posts: [{ id: "p2", images: [TARGET, "other"], title: "Gallery" }] },
      null,
    );
    const usage = await findMediaUsage(provider, TARGET);
    expect(usage.some((ref) => ref.entryId === "p2" && ref.field === "images")).toBe(true);
  });

  it("finds references in globals", async () => {
    const provider = makeProvider({}, { ogImage: TARGET });
    const usage = await findMediaUsage(provider, TARGET);
    expect(usage.length).toBeGreaterThan(0);
    expect(usage.every((ref) => ref.field === "ogImage")).toBe(true);
  });

  it("returns an empty list when nothing references the url", async () => {
    const provider = makeProvider({ posts: [{ cover: "other", id: "p1", title: "Hello" }] }, null);
    await expect(findMediaUsage(provider, TARGET)).resolves.toEqual([]);
  });
});
