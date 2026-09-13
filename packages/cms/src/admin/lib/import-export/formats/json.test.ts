import { describe, expect, it } from "vitest";

import { FORMAT_VERSION } from "../types";
import { jsonHandler } from "./json";

function file(name: string, content: string): File {
  return new File([content], name, { type: "application/json" });
}

describe("jsonHandler", () => {
  describe("parse", () => {
    it("parses a valid export document", async () => {
      const doc = {
        collections: { posts: [{ id: "abc", title: "Hello" }] },
        exportedAt: "2026-01-01T00:00:00.000Z",
        formatVersion: 1,
        globals: { site: { name: "Test" } },
      };
      const result = await jsonHandler.parse(file("export.json", JSON.stringify(doc)));
      expect(result.formatVersion).toBe(1);
      expect(result.collections.posts).toHaveLength(1);
      expect(result.globals.site).toEqual({ name: "Test" });
    });

    it("throws on invalid JSON", async () => {
      await expect(jsonHandler.parse(file("bad.json", "{not valid json"))).rejects.toThrow(
        "not valid JSON",
      );
    });

    it("throws when formatVersion is missing", async () => {
      const doc = { collections: {}, globals: {} };
      await expect(jsonHandler.parse(file("x.json", JSON.stringify(doc)))).rejects.toThrow(
        "formatVersion",
      );
    });
  });

  describe("serialize", () => {
    it("serializes to valid JSON", () => {
      const doc = {
        collections: { posts: [{ id: "1", title: "Hi" }] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: FORMAT_VERSION,
        globals: {},
      };
      const result = jsonHandler.serialize(doc);
      expect(result.mimeType).toBe("application/json");
      expect(result.extension).toBe("json");
      const parsed = JSON.parse(result.content as string);
      expect(parsed.formatVersion).toBe(FORMAT_VERSION);
    });
  });
});
