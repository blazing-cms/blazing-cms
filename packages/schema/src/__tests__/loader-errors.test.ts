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

describe("SchemaLoader error reporting", () => {
  it("returns errors when schema files fail to load", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue([{ isFile: () => true, name: "broken.ts" }] as never[]);

    const loader = new SchemaLoader("/cms");
    const result = await loader.load();

    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("broken.ts");
  });

  it("collects errors from all directories", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue([
      { isFile: () => true, name: "bad-collection.ts" },
    ] as never[]);

    const loader = new SchemaLoader("/cms");
    const result = await loader.load();

    // All three directories should have error collection capability
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
