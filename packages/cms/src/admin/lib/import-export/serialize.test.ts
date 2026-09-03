import { describe, expect, it } from "vitest";

import type { DataProvider, PaginatedResult } from "@/lib/providers/types";

import { buildFieldSources } from "./normalize";
import { assembleDocument, buildExport, exportCollection } from "./serialize";
import { FORMAT_VERSION } from "./types";

function emptyMediaFindMany(): PaginatedResult<Record<string, unknown>> {
  return { data: [], hasMore: false };
}

function createFakeProvider(
  findManyImpl: (
    collection: string,
    opts?: Record<string, unknown>,
  ) => Promise<PaginatedResult<Record<string, unknown>>>,
  getGlobalImpl: (slug: string) => Promise<Record<string, unknown> | null> = async () => null,
) {
  return {
    findMany: findManyImpl,
    getGlobal: getGlobalImpl,
    name: "fake",
    type: "mock",
  } as unknown as DataProvider;
}

describe("serialize.ts exportCollection", () => {
  it("paginates all entries into a single flat list", async () => {
    let page = 0;
    const provider = createFakeProvider(async (collection, _opts) => {
      if (collection === "media") return emptyMediaFindMany();
      page += 1;
      if (page === 1)
        return {
          cursor: "b",
          data: [
            { id: "a", title: "A" },
            { id: "b", title: "B" },
          ],
          hasMore: true,
        };
      return { data: [{ id: "c", title: "C" }], hasMore: false };
    });

    const fields = buildFieldSources({ collections: [{ fields: [], slug: "posts" }] });
    const rows = await exportCollection(provider, "posts", fields);

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(rows.map((r) => r.title)).toEqual(["A", "B", "C"]);
  });

  it("returns an empty array for an empty collection", async () => {
    const provider = createFakeProvider(async (collection) => {
      if (collection === "media") return emptyMediaFindMany();
      return { data: [], hasMore: false };
    });

    const fields = buildFieldSources({ collections: [{ fields: [], slug: "posts" }] });
    const rows = await exportCollection(provider, "posts", fields);
    expect(rows).toEqual([]);
  });

  it("preserves the original entry ids", async () => {
    const provider = createFakeProvider(async (collection) => {
      if (collection === "media") return emptyMediaFindMany();
      return { data: [{ id: "original-123", slug: "hello" }], hasMore: false };
    });

    const fields = buildFieldSources({ collections: [{ fields: [], slug: "pages" }] });
    const rows = await exportCollection(provider, "pages", fields);
    expect(rows[0]!.id).toBe("original-123");
  });
});

describe("serialize.ts assembleDocument", () => {
  it("creates a document with formatVersion and exportedAt", () => {
    const doc = assembleDocument({
      collections: { posts: [{ id: "1", title: "Hi" }] },
      globals: {},
    });
    expect(doc.formatVersion).toBe(FORMAT_VERSION);
    expect(doc.collections.posts).toHaveLength(1);
    expect(new Date(doc.exportedAt).toISOString()).toBe(doc.exportedAt);
  });
});

describe("serialize.ts buildExport", () => {
  it("exports all collections and globals by default", async () => {
    let mediaLoaded = false;
    const provider = createFakeProvider(
      async (collection, _opts) => {
        if (collection === "media") {
          mediaLoaded = true;
          return emptyMediaFindMany();
        }
        if (collection === "posts") return { data: [{ id: "1", title: "Hello" }], hasMore: false };
        return { data: [], hasMore: false };
      },
      async (slug) => {
        if (slug === "site") return { name: "My Site" };
        return null;
      },
    );

    const fields = buildFieldSources({
      collections: [{ fields: [], slug: "posts" }],
      globals: [{ fields: [], slug: "site" }],
    });

    const doc = await buildExport(provider, fields);
    expect(doc.collections.posts).toHaveLength(1);
    expect(doc.globals.site).toEqual({ name: "My Site" });
    expect(mediaLoaded).toBe(true);
  });
});
