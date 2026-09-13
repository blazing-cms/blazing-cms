import { existsSync, readdirSync } from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { SchemaLoader } from "../loader.js";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("SchemaLoader", () => {
  it("uses default schema directory (cms) when not specified", () => {
    const loader = new SchemaLoader();
    expect(loader).toBeInstanceOf(SchemaLoader);
  });

  it("setSchemaDir updates the directory", () => {
    const loader = new SchemaLoader("/old");
    loader.setSchemaDir("/new");
    expect(loader).toBeInstanceOf(SchemaLoader);
  });

  it("load returns empty arrays when schema directories don't exist", async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const loader = new SchemaLoader("/nonexistent");
    const result = await loader.load();
    expect(result).toEqual({ collections: [], components: [], errors: [], globals: [] });
    expect(readdirSync).not.toHaveBeenCalled();
  });

  it("load reads .ts and .js files from collections/globals/components dirs", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue([
      { isFile: () => true, name: "posts.ts" },
      { isFile: () => true, name: "categories.ts" },
      { isFile: () => false, name: "subdir" },
      { isFile: () => true, name: "readme.md" },
    ] as never[]);
    const loader = new SchemaLoader("/cms");
    const result = await loader.load();
    expect(result.collections.length + result.globals.length + result.components.length).toBe(0);
  });
});

describe("tryLoadFile", () => {
  it("returns items when module exports objects with slug", async () => {
    vi.mock("/path/to/valid.ts", () => ({
      default: { fields: [], slug: "posts" },
    }));
    const { tryLoadFile } = await import("../loader.js");
    const result = await tryLoadFile("/path/to/valid.ts");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toHaveProperty("slug", "posts");
    expect(result.errors).toHaveLength(0);
  });

  it("filters out exports without slug", async () => {
    vi.mock("/path/to/mixed.ts", () => ({
      default: { slug: "posts" },
      helper: { noSlug: true },
    }));
    const { tryLoadFile } = await import("../loader.js");
    const result = await tryLoadFile("/path/to/mixed.ts");
    expect(result.items).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("returns empty items with error when import fails", async () => {
    const { tryLoadFile } = await import("../loader.js");
    const result = await tryLoadFile("/nonexistent/file.ts");
    expect(result.items).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("nonexistent/file.ts");
  });
});
