import { describe, expect, it } from "vitest";

import { ParseError, parseImportFile, parseImportText } from "./parse";

function file(name: string, content: string): File {
  return new File([content], name, { type: "application/json" });
}

describe("parseImportText", () => {
  it("parses a valid export document", async () => {
    const doc = {
      collections: { posts: [{ id: "abc", title: "Hello" }] },
      exportedAt: "2026-01-01T00:00:00.000Z",
      formatVersion: 1,
      globals: { site: { name: "Test" } },
    };
    const result = await parseImportText(JSON.stringify(doc));
    expect(result.formatVersion).toBe(1);
    expect(result.collections.posts).toHaveLength(1);
    expect(result.globals.site).toEqual({ name: "Test" });
    expect(result.exportedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("fills defaults for missing exportedAt", async () => {
    const doc = {
      collections: {},
      formatVersion: 1,
      globals: {},
    };
    const result = await parseImportText(JSON.stringify(doc));
    expect(result.exportedAt).toBeTruthy();
    expect(new Date(result.exportedAt).toISOString()).toBe(result.exportedAt);
  });

  it("throws ParseError on invalid JSON", async () => {
    await expect(parseImportText("{not valid json")).rejects.toThrow(ParseError);
    await expect(parseImportText("")).rejects.toThrow(ParseError);
  });

  it("throws ParseError when formatVersion is missing", async () => {
    const doc = { collections: {}, globals: {} };
    await expect(parseImportText(JSON.stringify(doc))).rejects.toThrow(/formatVersion/);
  });

  it("throws ParseError for unsupported formatVersion", async () => {
    const doc = { collections: {}, formatVersion: 99, globals: {} };
    await expect(parseImportText(JSON.stringify(doc))).rejects.toThrow(/newer than supported/);
  });

  it("throws ParseError when collections is not a map of arrays", async () => {
    const doc = { collections: "not-an-object", formatVersion: 1, globals: {} };
    await expect(parseImportText(JSON.stringify(doc))).rejects.toThrow(/collections/);
  });

  it("throws ParseError when a collection value is not an array", async () => {
    const doc = { collections: { posts: {} }, formatVersion: 1, globals: {} };
    await expect(parseImportText(JSON.stringify(doc))).rejects.toThrow(/must contain an array/);
  });

  it("throws ParseError when globals is not a map", async () => {
    const doc = { collections: {}, formatVersion: 1, globals: [] };
    await expect(parseImportText(JSON.stringify(doc))).rejects.toThrow(/globals/);
  });

  it("throws ParseError for non-object input", async () => {
    await expect(parseImportText("42")).rejects.toThrow(/invalid structure/);
    await expect(parseImportText('"hello"')).rejects.toThrow(/invalid structure/);
  });
});

describe("parseImportFile", () => {
  it("reads and parses a file", async () => {
    const doc = {
      collections: { posts: [] },
      exportedAt: "2026-03-01T00:00:00.000Z",
      formatVersion: 1,
      globals: {},
    };
    const result = await parseImportFile(file("export.json", JSON.stringify(doc)));
    expect(result.formatVersion).toBe(1);
    expect(result.collections.posts).toEqual([]);
  });

  it("throws ParseError on invalid JSON file", async () => {
    await expect(parseImportFile(file("bad.json", "oops"))).rejects.toThrow(ParseError);
  });
});
