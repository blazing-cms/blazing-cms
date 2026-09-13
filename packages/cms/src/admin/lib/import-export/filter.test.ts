import { describe, expect, it } from "vitest";

import { filterDocument } from "./import";
import { FORMAT_VERSION, type ImportExportDocument, type ImportPreview } from "./types";

describe("filterDocument", () => {
  it("filters to only selected collections", () => {
    const doc: ImportExportDocument = {
      collections: {
        pages: [{ id: "2", title: "About" }],
        posts: [{ id: "1", title: "Hello" }],
      },
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: {},
    };

    const preview: ImportPreview = {
      collections: [
        { count: 1, selected: true, slug: "posts" },
        { count: 1, selected: false, slug: "pages" },
      ],
      format: "json",
      globals: [],
      totalEntries: 2,
    };

    const filtered = filterDocument(doc, preview);

    expect(Object.keys(filtered.collections)).toEqual(["posts"]);
    expect(filtered.collections.posts).toHaveLength(1);
  });

  it("filters to only selected globals", () => {
    const doc: ImportExportDocument = {
      collections: {},
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: { nav: { items: [] }, site: { name: "My Site" } },
    };

    const preview: ImportPreview = {
      collections: [],
      format: "json",
      globals: [
        { count: 0, selected: true, slug: "site" },
        { count: 0, selected: false, slug: "nav" },
      ],
      totalEntries: 0,
    };

    const filtered = filterDocument(doc, preview);

    expect(Object.keys(filtered.globals)).toEqual(["site"]);
    expect(filtered.globals.site).toEqual({ name: "My Site" });
  });

  it("returns empty document when all deselected", () => {
    const doc: ImportExportDocument = {
      collections: { posts: [{ id: "1", title: "Hello" }] },
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: { site: { name: "My Site" } },
    };

    const preview: ImportPreview = {
      collections: [{ count: 1, selected: false, slug: "posts" }],
      format: "json",
      globals: [{ count: 0, selected: false, slug: "site" }],
      totalEntries: 1,
    };

    const filtered = filterDocument(doc, preview);

    expect(Object.keys(filtered.collections)).toHaveLength(0);
    expect(Object.keys(filtered.globals)).toHaveLength(0);
  });
});
