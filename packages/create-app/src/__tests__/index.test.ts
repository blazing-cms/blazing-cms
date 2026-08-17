import { resolve } from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { scaffold } from "../index.js";

vi.mock("node:fs", async (importOriginal) => ({
  ...(await importOriginal()),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("node:readline", () => ({
  createInterface: vi.fn(() => ({
    close: vi.fn(),
    question: vi.fn((_q: string, cb: (a: string) => void) => cb("My Project")),
  })),
}));

const fs = await import("node:fs");
const rl = await import("node:readline");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("scaffold", () => {
  it("creates project directory structure", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    await scaffold("my-cms");
    expect(fs.mkdirSync).toHaveBeenCalledWith(resolve(process.cwd(), "my-cms", "cms/collections"), {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith(resolve(process.cwd(), "my-cms", "cms/globals"), {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith(resolve(process.cwd(), "my-cms", "src"), {
      recursive: true,
    });
  });

  it("creates all required files", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    await scaffold("my-cms");
    const calls = vi.mocked(fs.writeFileSync).mock.calls;
    const writtenFiles = calls.map((c) => c[0]);
    expect(writtenFiles.some((p) => p.toString().endsWith("package.json"))).toBe(true);
    expect(writtenFiles.some((p) => p.toString().endsWith("tsconfig.json"))).toBe(true);
    expect(writtenFiles.some((p) => p.toString().endsWith("blazing-cms.config.ts"))).toBe(true);
    expect(writtenFiles.some((p) => p.toString().endsWith(".env"))).toBe(true);
    expect(writtenFiles.some((p) => p.toString().endsWith(".env.example"))).toBe(true);
    expect(writtenFiles.some((p) => p.toString().endsWith(".gitignore"))).toBe(true);
    expect(writtenFiles.some((p) => p.toString().includes("cms/collections/posts.ts"))).toBe(true);
    expect(writtenFiles.some((p) => p.toString().includes("cms/globals/site-settings.ts"))).toBe(
      true,
    );
    expect(writtenFiles.some((p) => p.toString().endsWith("AGENTS.md"))).toBe(true);
  });

  it("writes the AGENTS.md template to the project root", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    await scaffold("my-cms");
    const calls = vi.mocked(fs.writeFileSync).mock.calls;
    const agentsCall = calls.find((c) => c[0].toString().endsWith("AGENTS.md"));
    const content = agentsCall?.[1] as string;
    expect(content).toContain("# AGENTS.md — Blazing CMS Project");
    expect(content).toContain("blazing-cms.config.ts");
    expect(content).toContain("validation: { required: true }");
  });

  it("package.json contains correct project name", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    await scaffold("my-cms");
    const calls = vi.mocked(fs.writeFileSync).mock.calls;
    const pkgCall = calls.find((c) => c[0].toString().endsWith("package.json"));
    const content = pkgCall?.[1] as string;
    expect(content).toContain('"name": "my-cms"');
    expect(content).toContain('"@blazing-cms/cms"');
  });

  it("blazing-cms.config.ts uses display name from prompt", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    await scaffold("my-cms");
    const calls = vi.mocked(fs.writeFileSync).mock.calls;
    const configCall = calls.find((c) => c[0].toString().endsWith("blazing-cms.config.ts"));
    const content = configCall?.[1] as string;
    expect(content).toContain("My Project");
  });

  it("handles empty prompt response by falling back to project name", async () => {
    vi.mocked(rl.createInterface).mockReturnValue({
      close: vi.fn(),
      question: vi.fn((_q: string, cb: (a: string) => void) => cb("")),
    } as never);
    vi.mocked(fs.existsSync).mockReturnValue(false);
    await scaffold("fallback-test");
    const calls = vi.mocked(fs.writeFileSync).mock.calls;
    const configCall = calls.find((c) => c[0].toString().endsWith("blazing-cms.config.ts"));
    const content = configCall?.[1] as string;
    expect(content).toContain("fallback-test");
  });

  it("logs next steps on success", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await scaffold("my-cms");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Project"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("my-cms"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("cd my-cms"));
    warnSpy.mockRestore();
  });

  it("calls process.exit(1) when directory already exists", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const exitMock = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(scaffold(".")).rejects.toThrow("exit");
    expect(exitMock).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("already exists"));
    exitMock.mockRestore();
    errorSpy.mockRestore();
  });
});
