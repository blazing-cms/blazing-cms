import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockBuild, mockDeploy, mockDev, mockDoctor, mockGenerate, mockLint, mockScaffold } =
  vi.hoisted(() => ({
    mockBuild: vi.fn(),
    mockDeploy: vi.fn(),
    mockDev: vi.fn(),
    mockDoctor: vi.fn(),
    mockGenerate: vi.fn(),
    mockLint: vi.fn(),
    mockScaffold: vi.fn(),
  }));

vi.mock("dotenv", () => ({ config: vi.fn() }));

vi.mock("../commands/dev.js", () => ({ dev: mockDev }));
vi.mock("../commands/build.js", () => ({ build: mockBuild }));
vi.mock("../commands/generate.js", () => ({ generate: mockGenerate }));
vi.mock("../commands/deploy.js", () => ({ deploy: mockDeploy }));
vi.mock("../commands/scaffold.js", () => ({ scaffold: mockScaffold }));
vi.mock("../commands/lint.js", () => ({ lint: mockLint }));
vi.mock("../commands/doctor.js", () => ({ doctor: mockDoctor }));

import { main, defineConfig } from "../index.js";

function setArgv(...args: string[]) {
  process.argv = ["/node", "/blaze", ...args];
}

describe("defineConfig", () => {
  it("returns the config object", () => {
    const config = { firebase: { projectId: "test" } };
    expect(defineConfig(config)).toBe(config);
  });
});

describe("main", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows help with no arguments", async () => {
    setArgv();
    await main();
    expect(console.warn).toHaveBeenCalled();
  });

  it("shows help with --help", async () => {
    setArgv("--help");
    await main();
    expect(console.warn).toHaveBeenCalled();
  });

  it("dispatches dev command", async () => {
    setArgv("dev");
    await main();
    expect(mockDev).toHaveBeenCalledWith({
      emulator: false,
      host: undefined,
      port: undefined,
      sync: false,
    });
  });

  it("dispatches dev with flags", async () => {
    setArgv("dev", "--emulator", "--host", "0.0.0.0", "--port", "3000", "--sync");
    await main();
    expect(mockDev).toHaveBeenCalledWith({
      emulator: true,
      host: "0.0.0.0",
      port: 3000,
      sync: true,
    });
  });

  it("dispatches build command", async () => {
    setArgv("build");
    await main();
    expect(mockBuild).toHaveBeenCalledWith({});
  });

  it("dispatches generate command", async () => {
    setArgv("generate", "types");
    await main();
    expect(mockGenerate).toHaveBeenCalledWith({ dir: undefined, type: "types" });
  });

  it("dispatches generate with --dir", async () => {
    setArgv("generate", "--dir", "my-schemas");
    await main();
    expect(mockGenerate).toHaveBeenCalledWith({ dir: "my-schemas", type: undefined });
  });

  it("dispatches generate with a positional type", async () => {
    setArgv("generate", "sdk", "--dir", "my-schemas");
    await main();
    expect(mockGenerate).toHaveBeenCalledWith({ dir: "my-schemas", type: "sdk" });
  });

  it("ignores non-type flag values as the generate type", async () => {
    setArgv("generate", "--dir", "registry");
    await main();
    expect(mockGenerate).toHaveBeenCalledWith({ dir: "registry", type: undefined });
  });

  it("dispatches deploy command", async () => {
    setArgv("deploy");
    await main();
    expect(mockDeploy).toHaveBeenCalledWith({ project: undefined });
  });

  it("dispatches deploy with --project", async () => {
    setArgv("deploy", "--project", "my-proj");
    await main();
    expect(mockDeploy).toHaveBeenCalledWith({ project: "my-proj" });
  });

  it("dispatches scaffold command", async () => {
    setArgv("scaffold");
    await main();
    expect(mockScaffold).toHaveBeenCalledWith({ name: undefined, type: undefined });
  });

  it("dispatches scaffold with type then --name", async () => {
    setArgv("scaffold", "collection", "--name", "articles");
    await main();
    expect(mockScaffold).toHaveBeenCalledWith({ name: "articles", type: "collection" });
  });

  it("dispatches lint command", async () => {
    setArgv("lint");
    await main();
    expect(mockLint).toHaveBeenCalledWith({ dir: undefined });
  });

  it("dispatches lint with --dir", async () => {
    setArgv("lint", "--dir", "my-dir");
    await main();
    expect(mockLint).toHaveBeenCalledWith({ dir: "my-dir" });
  });

  it("dispatches doctor command", async () => {
    setArgv("doctor");
    await main();
    expect(mockDoctor).toHaveBeenCalledWith({ dir: undefined });
  });

  it("dispatches doctor with --dir", async () => {
    setArgv("doctor", "--dir", "my-dir");
    await main();
    expect(mockDoctor).toHaveBeenCalledWith({ dir: "my-dir" });
  });

  it("shows error for unknown command", async () => {
    setArgv("foobar");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await main();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown command"));
  });
});
