import { describe, expect, it } from "vitest";

import { csvHandler } from "./csv";

function file(name: string, content: string): File {
  return new File([content], name, { type: "text/csv" });
}

function getCsvImport(result: Awaited<ReturnType<typeof csvHandler.parse>>) {
  return result.collections._csv_import ?? [];
}

describe("csvHandler", () => {
  describe("parse", () => {
    it("parses valid CSV with headers and rows", async () => {
      const csv = "id,title,slug\nabc,Hello World,hello-world\n,Second,second";
      const result = await csvHandler.parse(file("test.csv", csv));
      const entries = getCsvImport(result);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        id: "abc",
        slug: "hello-world",
        title: "Hello World",
      });
    });

    it("handles quoted fields with commas", async () => {
      const csv = 'id,title\n1,"Hello, World"';
      const result = await csvHandler.parse(file("test.csv", csv));
      const entries = getCsvImport(result);
      expect(entries[0]?.title).toBe("Hello, World");
    });

    it("handles escaped quotes", async () => {
      const csv = 'id,title\n1,"Say ""hello"""';
      const result = await csvHandler.parse(file("test.csv", csv));
      const entries = getCsvImport(result);
      expect(entries[0]?.title).toBe('Say "hello"');
    });

    it("coerces numbers", async () => {
      const csv = "id,count\n1,42";
      const result = await csvHandler.parse(file("test.csv", csv));
      const entries = getCsvImport(result);
      expect(entries[0]?.count).toBe(42);
    });

    it("coerces booleans", async () => {
      const csv = "id,active\n1,true";
      const result = await csvHandler.parse(file("test.csv", csv));
      const entries = getCsvImport(result);
      expect(entries[0]?.active).toBe(true);
    });

    it("skips entries missing id", async () => {
      const csv = "id,title\n,Hello";
      const result = await csvHandler.parse(file("test.csv", csv));
      const entries = getCsvImport(result);
      expect(entries).toHaveLength(0);
    });

    it("returns empty for header-only CSV", async () => {
      const csv = "id,title";
      const result = await csvHandler.parse(file("test.csv", csv));
      const entries = getCsvImport(result);
      expect(entries).toHaveLength(0);
    });
  });

  describe("serialize", () => {
    it("exports entries to CSV with headers", () => {
      const doc = {
        collections: {
          posts: [
            { id: "1", slug: "hello", title: "Hello" },
            { id: "2", slug: "world", title: "World" },
          ],
        },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = csvHandler.serialize(doc);
      const lines = (result.content as string).split("\n");
      expect(lines[0]).toBe("id,slug,title");
      expect(lines[1]).toBe("1,hello,Hello");
      expect(lines[2]).toBe("2,world,World");
    });

    it("escapes fields with commas", () => {
      const doc = {
        collections: { posts: [{ id: "1", title: "Hello, World" }] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = csvHandler.serialize(doc);
      expect(result.content).toContain('"Hello, World"');
    });

    it("handles empty collections", () => {
      const doc = {
        collections: { posts: [] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = csvHandler.serialize(doc);
      expect(result.content).toBe("");
    });
  });
});
