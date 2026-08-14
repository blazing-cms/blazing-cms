/* eslint-disable no-secrets/no-secrets */

import type { CollectionDefinition, GlobalDefinition } from "@blazing-cms/types";

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

import type { Generator } from "./generator.js";

export class SdkGenerator implements Generator {
  name = "sdk";

  async generate(
    collections: CollectionDefinition[],
    globals: GlobalDefinition[],
    _components: unknown[],
    outDir: string,
  ): Promise<void> {
    mkdirSync(outDir, { recursive: true });
    let output = `// Auto-generated Blazing CMS SDK — do not edit\n\n`;
    output += `import { createBlazeClient } from "@blazing-cms/sdk";\n`;
    output += `import { capabilities } from "./app-config";\n\n`;
    output += `const client = createBlazeClient({\n`;
    output += `  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",\n`;
    output += `  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",\n`;
    output += `  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",\n`;
    output += `  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",\n`;
    output += `  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",\n`;
    output += `  features: capabilities.features,\n`;
    output += `});\n\n`;

    for (const collection of collections) {
      const slug = collection.slug;
      output += `export const ${camelCase(slug)} = {\n`;
      output += `  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>\n`;
      output += `    client.collection("${slug}").findMany(options),\n`;
      output += `  findById: (id: string) => client.collection("${slug}").findById(id),\n`;
      output += `  create: (data: Record<string, unknown>) => client.collection("${slug}").create(data),\n`;
      output += `  update: (id: string, data: Record<string, unknown>) => client.collection("${slug}").update(id, data),\n`;
      output += `  delete: (id: string) => client.collection("${slug}").delete(id),\n`;
      output += `};\n\n`;
    }

    for (const global of globals) {
      output += `export const ${camelCase(global.slug)} = {\n`;
      output += `  get: () => client.globals.get("${global.slug}"),\n`;
      output += `  upsert: (data: Record<string, unknown>) => client.globals.upsert("${global.slug}", data),\n`;
      output += `};\n\n`;
    }

    writeFileSync(resolve(outDir, "sdk.ts"), output);
  }
}

function pascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_: string, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_: string, c: string) => c.toUpperCase());
}

function camelCase(str: string): string {
  const p = pascalCase(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}
