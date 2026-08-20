import type {
  CollectionDefinition,
  GlobalDefinition,
  ComponentDefinition,
} from "@blazing-cms/types";

import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
export interface SchemaResult {
  collections: CollectionDefinition[];
  globals: GlobalDefinition[];
  components: ComponentDefinition[];
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
    return { collections, components, globals };
  }

  private async loadFromDir<T>(subdir: string): Promise<T[]> {
    const dir = resolve(this.schemaDir, subdir);
    if (!existsSync(dir)) return [];
    const entries = readdirSync(dir, { withFileTypes: true });
    const results: T[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || (!entry.name.endsWith(".ts") && !entry.name.endsWith(".js"))) continue;
      const filePath = resolve(dir, entry.name);
      const items = await (this.forceReload
        ? tryLoadFileFresh<T>(filePath)
        : tryLoadFile<T>(filePath));
      results.push(...items);
    }
    return results;
  }
}

export async function tryLoadFile<T>(filePath: string): Promise<T[]> {
  try {
    const mod = (await import(filePath)) as Record<string, unknown>;
    const exported = Object.values(mod);
    const results: T[] = [];
    for (const val of exported) {
      if (val && typeof val === "object" && "slug" in val) {
        results.push(val as T);
      }
    }
    return results;
  } catch (err) {
    console.error(`Error loading schema file ${filePath}:`, err);
    return [];
  }
}

async function tryLoadFileFresh<T>(filePath: string): Promise<T[]> {
  try {
    const url = pathToFileURL(filePath);
    url.searchParams.set("t", String(Date.now()));
    const mod = (await import(url.href)) as Record<string, unknown>;
    const exported = Object.values(mod);
    const results: T[] = [];
    for (const val of exported) {
      if (val && typeof val === "object" && "slug" in val) {
        results.push(val as T);
      }
    }
    return results;
  } catch (err) {
    console.error(`Error loading schema file ${filePath}:`, err);
    return [];
  }
}
