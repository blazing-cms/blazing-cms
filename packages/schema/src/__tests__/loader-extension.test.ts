import { existsSync } from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveImportPath", () => {
  it("resolves exact path when file exists", async () => {
    vi.mocked(existsSync).mockImplementation((p) => p === "/cms/schema.ts");
    const { resolveImportPath } = await import("../loader.js");
    const result = resolveImportPath("/cms/schema.ts");
    expect(result).toBe("/cms/schema.ts");
  });

  it("resolves .ts extension for extensionless path", async () => {
    vi.mocked(existsSync).mockImplementation((p) => p === "/cms/lib/options.ts");
    const { resolveImportPath } = await import("../loader.js");
    const result = resolveImportPath("/cms/lib/options");
    expect(result).toBe("/cms/lib/options.ts");
  });

  it("resolves .tsx extension when .ts does not exist", async () => {
    vi.mocked(existsSync).mockImplementation((p) => p === "/cms/components/Widget.tsx");
    const { resolveImportPath } = await import("../loader.js");
    const result = resolveImportPath("/cms/components/Widget");
    expect(result).toBe("/cms/components/Widget.tsx");
  });

  it("resolves .js extension when .ts and .tsx do not exist", async () => {
    vi.mocked(existsSync).mockImplementation((p) => p === "/cms/utils/helpers.js");
    const { resolveImportPath } = await import("../loader.js");
    const result = resolveImportPath("/cms/utils/helpers");
    expect(result).toBe("/cms/utils/helpers.js");
  });

  it("resolves /index.ts for directory import", async () => {
    vi.mocked(existsSync).mockImplementation((p) => p === "/cms/plugins/index.ts");
    const { resolveImportPath } = await import("../loader.js");
    const result = resolveImportPath("/cms/plugins");
    expect(result).toBe("/cms/plugins/index.ts");
  });

  it("resolves /index.js when /index.ts does not exist", async () => {
    vi.mocked(existsSync).mockImplementation((p) => p === "/cms/plugins/index.js");
    const { resolveImportPath } = await import("../loader.js");
    const result = resolveImportPath("/cms/plugins");
    expect(result).toBe("/cms/plugins/index.js");
  });

  it("returns null for non-existent paths", async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const { resolveImportPath } = await import("../loader.js");
    const result = resolveImportPath("/nonexistent/file");
    expect(result).toBeNull();
  });
});
