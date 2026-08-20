import type { MockInstance } from "vitest";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockExistsSync, mockMkdirSync, mockPrompt, mockWriteFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockPrompt: vi.fn(),
  mockWriteFileSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  writeFileSync: mockWriteFileSync,
}));

vi.mock("../commands/utils/prompt.js", () => ({ prompt: mockPrompt }));

import { scaffold } from "../commands/scaffold.js";

describe("scaffold", () => {
  let exitSpy: MockInstance;
  const origCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.cwd = vi.fn(() => "/test/project");
  });

  afterEach(() => {
    process.cwd = origCwd;
    vi.restoreAllMocks();
  });

  it("creates a collection schema file", async () => {
    mockExistsSync.mockReturnValue(true);
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    await scaffold({ name: "articles", type: "collection" });
    expect(mockMkdirSync).not.toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/test/project/src/cms/collections/articles.ts",
      expect.stringContaining("articles"),
    );
  });

  it("creates a global schema file", async () => {
    mockExistsSync.mockReturnValue(true);
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    await scaffold({ name: "site-settings", type: "global" });
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/test/project/src/cms/globals/site-settings.ts",
      expect.stringContaining("site-settings"),
    );
  });

  it("creates a component schema file", async () => {
    mockExistsSync.mockReturnValue(true);
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    await scaffold({ name: "hero", type: "component" });
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/test/project/src/cms/components/hero.ts",
      expect.stringContaining("hero"),
    );
  });

  it("creates schema dir when it does not exist", async () => {
    mockExistsSync.mockReturnValueOnce(false);
    mockExistsSync.mockReturnValueOnce(false);
    await scaffold({ name: "posts", type: "collection" });
    expect(mockMkdirSync).toHaveBeenCalledWith("/test/project/src/cms/collections", {
      recursive: true,
    });
  });

  it("exits if schema already exists", async () => {
    mockExistsSync.mockReturnValueOnce(true);
    mockExistsSync.mockReturnValueOnce(true);
    await expect(scaffold({ name: "posts", type: "collection" })).rejects.toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits on unknown type", async () => {
    mockExistsSync.mockReturnValueOnce(true);
    mockExistsSync.mockReturnValueOnce(false);
    await expect(scaffold({ name: "foo", type: "unknown" })).rejects.toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prompts when type is not provided", async () => {
    mockPrompt.mockResolvedValue("collection");
    mockExistsSync.mockReturnValue(true);
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    await scaffold({ name: "posts" });
    expect(mockPrompt).toHaveBeenCalledWith(expect.stringContaining("Type?"));
  });

  it("prompts when name is not provided", async () => {
    mockPrompt.mockResolvedValue("posts");
    mockExistsSync.mockReturnValue(true);
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    await scaffold({ type: "collection" });
    expect(mockPrompt).toHaveBeenCalledWith(expect.stringContaining("Slug"));
  });
});
