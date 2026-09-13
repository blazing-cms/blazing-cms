import type {
  CollectionDefinition,
  GlobalDefinition,
  ComponentDefinition,
} from "@blazing-cms/types";

import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function resolveImportPath(filePath: string): string | null {
  const extensions = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.js"];

  for (const ext of extensions) {
    const fullPath = filePath + ext;
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}
export interface SchemaResult {
  collections: CollectionDefinition[];
  globals: GlobalDefinition[];
  components: ComponentDefinition[];
  errors: string[];
}

export class SchemaLoader {
  private schemaDir: string;
  private forceReload: boolean;

  constructor(schemaDir?: string, forceReload?: boolean) {
    this.schemaDir = schemaDir ?? resolve(process.cwd(), "src/cms");
    this.forceReload = forceReload ?? false;
  }

  setSchemaDir(dir: string): void {
    this.schemaDir = resolve(dir);
  }

  async load(): Promise<SchemaResult> {
    const collections = await this.loadFromDir<CollectionDefinition>("collections");
    const globals = await this.loadFromDir<GlobalDefinition>("globals");
    const components = await this.loadFromDir<ComponentDefinition>("components");
    return {
      collections: collections.items,
      components: components.items,
      errors: [...collections.errors, ...globals.errors, ...components.errors],
      globals: globals.items,
    };
  }

  private async loadFromDir<T>(subdir: string): Promise<{ items: T[]; errors: string[] }> {
    const dir = resolve(this.schemaDir, subdir);
    if (!existsSync(dir)) return { errors: [], items: [] };
    const entries = readdirSync(dir, { withFileTypes: true });
    const items: T[] = [];
    const errors: string[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || (!entry.name.endsWith(".ts") && !entry.name.endsWith(".js"))) continue;
      const filePath = resolve(dir, entry.name);
      const result = await (this.forceReload
        ? tryLoadFileFresh<T>(filePath)
        : tryLoadFile<T>(filePath));
      items.push(...result.items);
      errors.push(...result.errors);
    }
    return { errors, items };
  }
}

export async function tryLoadFile<T>(filePath: string): Promise<{ items: T[]; errors: string[] }> {
  const resolvedPath = resolveImportPath(filePath);
  if (!resolvedPath) {
    const error = `  ✗ Could not resolve: ${filePath}`;
    console.error(error);
    return { errors: [error], items: [] };
  }

  try {
    const mod = (await import(resolvedPath)) as Record<string, unknown>;
    const exported = Object.values(mod);
    const results: T[] = [];
    for (const val of exported) {
      if (val && typeof val === "object" && "slug" in val) {
        results.push(val as T);
      }
    }
    return { errors: [], items: results };
  } catch (err) {
    const error = `  ✗ Failed to load ${resolvedPath}: ${err}`;
    console.error(error);
    return { errors: [error], items: [] };
  }
}

async function tryLoadFileFresh<T>(filePath: string): Promise<{ items: T[]; errors: string[] }> {
  const resolvedPath = resolveImportPath(filePath);
  if (!resolvedPath) {
    const error = `  ✗ Could not resolve: ${filePath}`;
    console.error(error);
    return { errors: [error], items: [] };
  }

  try {
    const url = pathToFileURL(resolvedPath);
    url.searchParams.set("t", String(Date.now()));
    const mod = (await import(url.href)) as Record<string, unknown>;
    const exported = Object.values(mod);
    const results: T[] = [];
    for (const val of exported) {
      if (val && typeof val === "object" && "slug" in val) {
        results.push(val as T);
      }
    }
    return { errors: [], items: results };
  } catch (err) {
    const error = `  ✗ Failed to load ${resolvedPath}: ${err}`;
    console.error(error);
    return { errors: [error], items: [] };
  }
}
