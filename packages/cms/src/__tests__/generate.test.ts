import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockExistsSync, mockMkdirSync, mockReadFileSync, mockWriteFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
}));

const { mockAddGenerator, mockLoad, mockRun } = vi.hoisted(() => ({
  mockAddGenerator: vi.fn(),
  mockLoad: vi.fn(),
  mockRun: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
}));

vi.mock("@blazing-cms/schema", () => ({
  CAPABILITY_NAMES: [
    "content",
    "analytics",
    "media",
    "versioning",
    "workflow",
    "notifications",
    "rbac",
  ],
  SchemaLoader: vi.fn(() => ({ load: mockLoad })),
}));

vi.mock("../commands/load-config.js", () => ({
  loadProjectConfig: vi.fn(async () => ({
    capabilities: undefined,
    projectName: "Blazing CMS",
  })),
}));

vi.mock("@blazing-cms/generators", () => ({
  GenerationPipeline: vi.fn(() => ({
    addGenerator: mockAddGenerator,
    run: mockRun,
  })),
  SdkGenerator: vi.fn(),
  TypeGenerator: vi.fn(),
  ValidationGenerator: vi.fn(),
}));

import { generate } from "../commands/generate.js";

const fakeSchema = {
  collections: [{ slug: "posts" }, { slug: "pages" }],
  components: [{ slug: "hero" }],
  globals: [{ slug: "site-settings" }],
};

describe("generate", () => {
  const origCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockLoad.mockResolvedValue(fakeSchema);
    mockRun.mockResolvedValue(undefined);
    mockReadFileSync.mockReturnValue('export default { projectName: "My App" }');
    process.cwd = vi.fn(() => "/test/project");
  });

  afterEach(() => {
    process.cwd = origCwd;
    vi.restoreAllMocks();
  });

  it("loads schemas and runs all generators by default", async () => {
    mockExistsSync.mockReturnValue(true);
    await generate({});

    expect(mockLoad).toHaveBeenCalledTimes(1);
    expect(mockAddGenerator).toHaveBeenCalledTimes(3);
    expect(mockRun).toHaveBeenCalledWith(
      fakeSchema.collections,
      fakeSchema.globals,
      fakeSchema.components,
      expect.any(String),
    );
  });

  it("runs only specified generator type", async () => {
    mockExistsSync.mockReturnValue(true);
    await generate({ type: "types" });

    expect(mockAddGenerator).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(
      fakeSchema.collections,
      fakeSchema.globals,
      fakeSchema.components,
      expect.any(String),
    );
  });

  it("warns when schema dir does not exist", async () => {
    mockExistsSync.mockReturnValue(false);

    await generate({});

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("not found"));
    expect(mockLoad).not.toHaveBeenCalled();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("creates outDir if it does not exist", async () => {
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValue(true);

    await generate({});

    expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it("generates schema registry, app config, rules, and indexes", async () => {
    mockExistsSync.mockReturnValue(true);

    await generate({ type: "registry" });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("schema-registry.ts"),
      expect.stringContaining("posts"),
    );
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("app-config.ts"),
      expect.any(String),
    );
  });

  it("generates firestore rules", async () => {
    mockExistsSync.mockReturnValue(true);

    await generate({ type: "rules" });

    const call = mockWriteFileSync.mock.calls.find((c) =>
      c[0].toString().endsWith("firestore.rules"),
    )!;
    expect(call).toBeDefined();
    expect(call[1]).toContain("collections_posts");
    expect(call[1]).not.toContain("validPostsWorkflow");
    expect(call[1]).toContain(
      'allow update: if hasGrant("collections:posts:update") || hasGrant("collections:*:update");',
    );
  });

  it("generates workflow-gated rules for workflow collections", async () => {
    mockExistsSync.mockReturnValue(true);
    mockLoad.mockResolvedValue({
      collections: [
        {
          slug: "posts",
          workflow: {
            defaultState: "draft",
            states: [
              { label: "Draft", name: "draft" },
              { label: "Published", name: "published" },
            ],
            transitions: [{ from: "draft", to: "published" }],
          },
        },
      ],
      components: [],
      globals: [],
    });

    await generate({ type: "rules" });

    const call = mockWriteFileSync.mock.calls.find((c) =>
      c[0].toString().endsWith("firestore.rules"),
    )!;
    expect(call[1]).toContain("function validPostsWorkflow()");
    expect(call[1]).toContain(
      'allow create: if (hasGrant("collections:posts:create") || hasGrant("collections:*:create")) && (request.resource.data.workflowState == null || request.resource.data.workflowState == "draft");',
    );
    expect(call[1]).toContain(
      'allow update: if (hasGrant("collections:posts:update") || hasGrant("collections:*:update")) && validPostsWorkflow();',
    );
    expect(call[1]).toContain(
      'resource.data.workflowState == "draft" && request.resource.data.workflowState == "published"',
    );
  });

  it("uses the first state as default when no defaultState is set", async () => {
    mockExistsSync.mockReturnValue(true);
    mockLoad.mockResolvedValue({
      collections: [
        {
          slug: "pages",
          workflow: { transitions: [{ from: "draft", to: "published" }] },
        },
      ],
      components: [],
      globals: [],
    });

    await generate({ type: "rules" });

    const call = mockWriteFileSync.mock.calls.find((c) =>
      c[0].toString().endsWith("firestore.rules"),
    )!;
    expect(call[1]).toContain('request.resource.data.workflowState == "draft"');
  });

  it("generates firestore indexes", async () => {
    mockExistsSync.mockReturnValue(true);

    await generate({ type: "indexes" });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("firestore.indexes.json"),
      expect.any(String),
    );
  });

  it("accepts custom outDir", async () => {
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValue(true);

    await generate({ outDir: "my-output" });

    expect(mockMkdirSync).toHaveBeenCalledWith("/test/project/my-output", { recursive: true });
  });

  it("uses default project name when config file is missing", async () => {
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);

    await generate({ type: "registry" });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("app-config.ts"),
      expect.stringContaining("Blazing CMS"),
    );
  });

  it("uses default project name when config lacks projectName", async () => {
    mockReadFileSync.mockReturnValue(
      'export default defineConfig({ firebase: { projectId: "x" } })',
    );
    mockExistsSync.mockReturnValue(true);

    await generate({ type: "registry" });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("app-config.ts"),
      expect.stringContaining("Blazing CMS"),
    );
  });
});
