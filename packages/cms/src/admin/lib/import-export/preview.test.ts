import { describe, expect, it } from "vitest";

import { buildImportPreview } from "./preview";
import { FORMAT_VERSION, type ImportExportDocument } from "./types";

describe("buildImportPreview", () => {
  it("builds preview from document with collections and globals", () => {
    const doc: ImportExportDocument = {
      collections: {
        pages: [
          { id: "2", title: "About" },
          { id: "3", title: "Contact" },
        ],
        posts: [{ id: "1", title: "Hello" }],
      },
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: { site: { name: "My Site" } },
    };

    const preview = buildImportPreview(doc, "json");

    expect(preview.format).toBe("json");
    expect(preview.collections).toHaveLength(2);
    expect(preview.collections[0]).toEqual({ count: 1, selected: true, slug: "posts" });
    expect(preview.collections[1]).toEqual({ count: 2, selected: true, slug: "pages" });
    expect(preview.globals).toHaveLength(1);
    expect(preview.globals[0]).toEqual({ count: 0, selected: true, slug: "site" });
    expect(preview.totalEntries).toBe(3);
  });

  it("handles empty document", () => {
    const doc: ImportExportDocument = {
      collections: {},
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: {},
    };

    const preview = buildImportPreview(doc, "csv");

    expect(preview.format).toBe("csv");
    expect(preview.collections).toHaveLength(0);
    expect(preview.globals).toHaveLength(0);
    expect(preview.totalEntries).toBe(0);
  });

  it("counts entries correctly", () => {
    const doc: ImportExportDocument = {
      collections: {
        posts: [
          { id: "1", title: "A" },
          { id: "2", title: "B" },
          { id: "3", title: "C" },
        ],
      },
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: {},
    };

    const preview = buildImportPreview(doc, "xml");
    expect(preview.totalEntries).toBe(3);
  });
});
