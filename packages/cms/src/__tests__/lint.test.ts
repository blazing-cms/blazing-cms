import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLoad, mockValidateCapabilities, mockValidateCollection, mockValidateGlobal } =
  vi.hoisted(() => ({
    mockLoad: vi.fn(),
    mockValidateCapabilities: vi.fn(),
    mockValidateCollection: vi.fn(),
    mockValidateGlobal: vi.fn(),
  }));

vi.mock("@blazing-cms/schema", () => ({
  SchemaLoader: vi.fn(() => ({ load: mockLoad })),
  SchemaValidator: vi.fn(() => ({
    validateCapabilities: mockValidateCapabilities,
    validateCollection: mockValidateCollection,
    validateGlobal: mockValidateGlobal,
  })),
}));

import { lint } from "../commands/lint.js";

describe("lint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateGlobal.mockReturnValue([]);
    mockValidateCapabilities.mockReturnValue([]);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("reports all schemas valid when no errors", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    mockLoad.mockResolvedValue({ collections: [{ slug: "posts" }], components: [], globals: [] });
    mockValidateCollection.mockReturnValue([]);

    await lint({});

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("All schemas valid"));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("reports validation errors", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    mockLoad.mockResolvedValue({ collections: [{ slug: "posts" }], components: [], globals: [] });
    mockValidateCollection.mockReturnValue([
      { message: "Collection slug is required", path: "slug" },
    ]);

    await lint({});

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("slug"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("handles empty collections", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    mockLoad.mockResolvedValue({ collections: [], components: [], globals: [] });
    mockValidateCapabilities.mockReturnValue([]);

    await lint({});

    expect(mockValidateCollection).not.toHaveBeenCalled();
    expect(mockValidateGlobal).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
