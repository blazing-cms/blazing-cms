import type { DataProvider } from "@/lib/providers/types";

import { collections, globals } from "@/__generated__/schema-registry";

export interface MediaReference {
  collection: string;
  entryId: string;
  title: string;
  field: string;
}

function objectReferences(data: unknown, target: string): boolean {
  if (data && typeof data === "object") {
    return Object.values(data).some((value) => referencesValue(value, target));
  }
  return false;
}

function referencesValue(data: unknown, target: string): boolean {
  if (typeof data === "string") return data.includes(target);
  if (Array.isArray(data)) return data.some((item) => referencesValue(item, target));
  return objectReferences(data, target);
}

function entryId(doc: Record<string, unknown>): string {
  return String(doc.id ?? "");
}

function entryTitle(doc: Record<string, unknown>): string {
  return String(doc.title ?? doc.id ?? "");
}

function toReference(slug: string, entryId: string, title: string, field: string): MediaReference {
  return { collection: slug, entryId, field, title };
}

function collectFromDoc(
  doc: Record<string, unknown>,
  slug: string,
  target: string,
): MediaReference[] {
  const refs: MediaReference[] = [];
  for (const [key, value] of Object.entries(doc)) {
    if (referencesValue(value, target)) {
      refs.push(toReference(slug, entryId(doc), entryTitle(doc), key));
    }
  }
  return refs;
}

async function scanCollections(provider: DataProvider, target: string): Promise<MediaReference[]> {
  const refs: MediaReference[] = [];
  for (const definition of collections) {
    const result = await provider.findMany(definition.slug, { limit: 200 });
    for (const doc of result.data) {
      refs.push(...collectFromDoc(doc, definition.slug, target));
    }
  }
  return refs;
}

async function scanGlobals(provider: DataProvider, target: string): Promise<MediaReference[]> {
  const refs: MediaReference[] = [];
  for (const definition of globals) {
    const doc = await provider.getGlobal(definition.slug);
    if (!doc) continue;
    refs.push(...collectFromDoc(doc, definition.slug, target));
  }
  return refs;
}

export async function findMediaUsage(
  provider: DataProvider,
  target: string,
): Promise<MediaReference[]> {
  const refs = await scanCollections(provider, target);
  refs.push(...(await scanGlobals(provider, target)));
  return refs;
}
