import type { FieldDefinition } from "@blazing-cms/types";

import { describe, expect, it } from "vitest";

import { mockProvider } from "@/lib/providers/mock";

import { prepareImport } from "./import";
import { buildFieldSources, buildMediaMaps, emptyFieldSources } from "./normalize";
import { FORMAT_VERSION, type ImportExportDocument, type ImportExportEntry } from "./types";

function uniqueSlug(): string {
  return `ie_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeDoc(
  collections: Record<string, ImportExportEntry[]> = {},
  globals: Record<string, Record<string, unknown>> = {},
): ImportExportDocument {
  return {
    collections,
    exportedAt: new Date().toISOString(),
    formatVersion: FORMAT_VERSION,
    globals,
  };
}

describe("mock provider importContent", () => {
  it("skips entries with existing ids and imports new ones", async () => {
    const slug = uniqueSlug();
    await mockProvider.create(slug, { id: "existing-1", title: "Original" });

    const result = await mockProvider.importContent(
      {
        [slug]: [
          { data: { title: "Updated" }, id: "existing-1" },
          { data: { title: "Brand new" }, id: "new-2" },
        ],
      },
      {},
    );

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);

    const existing = await mockProvider.findOne(slug, "existing-1");
    expect(existing?.title).toBe("Original");

    const newcomer = await mockProvider.findOne(slug, "new-2");
    expect(newcomer?.title).toBe("Brand new");
  });

  it("skips globals that already exist and imports new ones", async () => {
    const slug = uniqueSlug();
    await mockProvider.upsertGlobal(slug, { name: "Keep me" });

    const result = await mockProvider.importContent(
      {},
      { [`${slug}_new`]: { name: "Should import" }, [slug]: { name: "Should skip" } },
    );

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);

    const kept = await mockProvider.getGlobal(slug);
    expect(kept?.name).toBe("Keep me");

    const fresh = await mockProvider.getGlobal(`${slug}_new`);
    expect(fresh?.name).toBe("Should import");
  });

  it("reports progress correctly", async () => {
    const slug = uniqueSlug();
    const progress: Array<{ done: number; total: number }> = [];

    await mockProvider.importContent(
      {
        [slug]: [
          { data: {}, id: "a" },
          { data: {}, id: "b" },
        ],
      },
      {},
      (p) => progress.push({ ...p }),
    );

    expect(progress).toHaveLength(2);
    expect(progress[0]).toEqual({ done: 1, total: 2 });
    expect(progress[1]).toEqual({ done: 2, total: 2 });
  });
});

describe("prepareImport", () => {
  it("skips entries for collections not in the schema", () => {
    const doc = makeDoc({ unknown_col: [{ id: "1", title: "Hi" }] });
    const result = prepareImport(doc, emptyFieldSources(), buildMediaMaps([]));
    expect(result.preSkipped).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toMatch(/not configured/);
    expect(result.collections.unknown_col).toEqual([]);
  });

  it("skips entries missing an id", () => {
    const fields = buildFieldSources({
      collections: [{ fields: [], slug: "posts" }],
    });
    const doc = makeDoc({ posts: [{ title: "No id" } as unknown as ImportExportEntry] });
    const result = prepareImport(doc, fields, buildMediaMaps([]));
    expect(result.preSkipped).toBe(1);
    expect(result.errors[0]!.message).toMatch(/missing an id/);
  });

  it("skips entries that fail validation", () => {
    const requiredTitle: FieldDefinition = {
      name: "title",
      type: "text",
      validation: { required: true },
    } as FieldDefinition;
    const fields = buildFieldSources({
      collections: [{ fields: [requiredTitle], slug: "posts" }],
    });
    const doc = makeDoc({ posts: [{ id: "1" }] });
    const result = prepareImport(doc, fields, buildMediaMaps([]));
    expect(result.preSkipped).toBe(1);
    expect(result.errors[0]!.message).toMatch(/title/);
    expect(result.collections.posts).toEqual([]);
  });

  it("passes valid entries into batches", () => {
    const fields = buildFieldSources({
      collections: [{ fields: [], slug: "posts" }],
    });
    const doc = makeDoc({ posts: [{ id: "1", title: "Hello" }] });
    const result = prepareImport(doc, fields, buildMediaMaps([]));
    expect(result.preSkipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.collections.posts).toHaveLength(1);
    expect(result.collections.posts![0]!.id).toBe("1");
  });
});
