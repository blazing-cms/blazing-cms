import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGES_DIR = path.resolve(dirname, "../../..");

const PACKAGE_NAMES = [
  "cms",
  "core",
  "create-app",
  "generators",
  "permissions",
  "plugins",
  "schema",
  "sdk",
  "types",
  "validation",
] as const;

const BIN_FILES: Record<string, string> = {
  cms: "bin/cms.js",
  "create-app": "bin/create-blazing-cms-app.js",
};

interface PackedFile {
  mode: number;
  path: string;
  size: number;
}

interface PackManifest {
  files: PackedFile[];
  name: string;
  version: string;
}

const manifests = new Map<string, PackManifest>();

async function packPackage(name: string): Promise<PackManifest> {
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const { stdout } = await execFileAsync(command, ["pack", "--dry-run", "--json"], {
    cwd: path.join(PACKAGES_DIR, name),
    shell: process.platform === "win32",
  });
  const [manifest] = JSON.parse(stdout) as PackManifest[];
  if (!manifest) throw new Error(`npm pack returned no manifest for ${name}`);
  return manifest;
}

function pathsOf(name: string): string[] {
  const manifest = manifests.get(name);
  if (!manifest) throw new Error(`missing manifest for ${name}`);
  return manifest.files.map((file) => file.path);
}

beforeAll(async () => {
  await Promise.all(
    PACKAGE_NAMES.map(async (name) => {
      manifests.set(name, await packPackage(name));
    }),
  );
}, 120_000);

describe("packaging", () => {
  it("every package ships compiled dist output", () => {
    for (const name of PACKAGE_NAMES) {
      const paths = pathsOf(name);
      expect(paths, `${name} missing dist/index.js`).toContain("dist/index.js");
      expect(paths, `${name} missing dist/index.d.ts`).toContain("dist/index.d.ts");
    }
  });

  it("CLI packages ship their bin entry", () => {
    for (const [name, bin] of Object.entries(BIN_FILES)) {
      expect(pathsOf(name), `${name} missing ${bin}`).toContain(bin);
    }
  });

  it("no package ships test files", () => {
    for (const name of PACKAGE_NAMES) {
      const leaks = pathsOf(name).filter(
        (file) => file.includes("__tests__") || /\.test\./.test(file),
      );
      expect(leaks, `${name} ships test files: ${leaks.join(", ")}`).toEqual([]);
    }
  });

  it("no package ships dev config files", () => {
    for (const name of PACKAGE_NAMES) {
      const leaks = pathsOf(name).filter((file) =>
        /^(tsconfig\.json|vitest\.config\.ts)$/.test(file),
      );
      expect(leaks, `${name} ships dev configs: ${leaks.join(", ")}`).toEqual([]);
    }
  });

  it("only cms ships runtime source files", () => {
    for (const name of PACKAGE_NAMES) {
      if (name === "cms") continue;
      const leaks = pathsOf(name).filter((file) => /^src\/.*\.(ts|tsx)$/.test(file));
      expect(leaks, `${name} ships source files: ${leaks.join(", ")}`).toEqual([]);
    }
  });

  it("cms excludes generated and test-only source", () => {
    const leaks = pathsOf("cms").filter(
      (file) =>
        file.startsWith("src/admin/__generated__/") ||
        file.startsWith("src/__tests__/") ||
        file.startsWith("src/admin/lib/__tests__/"),
    );
    expect(leaks, `cms ships generated/test source: ${leaks.join(", ")}`).toEqual([]);
  });
});
