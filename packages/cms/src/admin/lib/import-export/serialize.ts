import type { DataProvider } from "@/lib/providers/types";

import {
  buildMediaMaps,
  toStoragePath,
  transformFields,
  type FieldSources,
  type MediaMaps,
} from "./normalize";
import {
  FORMAT_VERSION,
  type ImportExportCollections,
  type ImportExportDocument,
  type ImportExportEntry,
  type ImportExportGlobals,
} from "./types";

const EXPORT_PAGE = 100;

export interface ExportOptions {
  collections?: string[];
  globals?: string[];
}

async function loadMediaMaps(provider: DataProvider): Promise<MediaMaps> {
  const records: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const page = await provider.findMany("media", { cursor, limit: EXPORT_PAGE });
    records.push(...page.data);
    cursor = page.cursor;
    hasMore = page.hasMore;
  }
  return buildMediaMaps(records);
}

function normalizeEntry(
  doc: Record<string, unknown>,
  fields: FieldSources,
  collection: string,
  maps: MediaMaps,
): ImportExportEntry {
  const { id, ...data } = doc;
  const transformed = transformFields(
    data,
    fields.collections[collection] ?? [],
    fields,
    toStoragePath(maps),
  );
  return { id: String(id), ...(transformed as Record<string, unknown>) };
}

function normalizeGlobal(
  doc: Record<string, unknown>,
  fields: FieldSources,
  slug: string,
  maps: MediaMaps,
): Record<string, unknown> {
  const { id: _id, ...data } = doc;
  return transformFields(data, fields.globals[slug] ?? [], fields, toStoragePath(maps)) as Record<
    string,
    unknown
  >;
}

/** Export all entries of a single collection, attaching original doc ids. */
export async function exportCollection(
  provider: DataProvider,
  collection: string,
  fields: FieldSources,
): Promise<ImportExportEntry[]> {
  const maps = await loadMediaMaps(provider);
  const rows: ImportExportEntry[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const page = await provider.findMany(collection, { cursor, limit: EXPORT_PAGE });
    for (const doc of page.data) rows.push(normalizeEntry(doc, fields, collection, maps));
    cursor = page.cursor;
    hasMore = page.hasMore;
  }
  return rows;
}

/** Export a single global's data, normalized for the portable format. */
async function exportGlobal(
  provider: DataProvider,
  slug: string,
  fields: FieldSources,
): Promise<Record<string, unknown>> {
  const maps = await loadMediaMaps(provider);
  const doc = await provider.getGlobal(slug);
  return doc ? normalizeGlobal(doc, fields, slug, maps) : {};
}

/** Export all requested collections and globals into a single document. */
export async function buildExport(
  provider: DataProvider,
  fields: FieldSources,
  options?: ExportOptions,
): Promise<ImportExportDocument> {
  const collectionSlugs = options?.collections ?? Object.keys(fields.collections);
  const globalSlugs = options?.globals ?? Object.keys(fields.globals);

  const collections: ImportExportCollections = {};
  for (const slug of collectionSlugs) {
    collections[slug] = await exportCollection(provider, slug, fields);
  }

  const globals: ImportExportGlobals = {};
  for (const slug of globalSlugs) {
    globals[slug] = await exportGlobal(provider, slug, fields);
  }

  return assembleDocument({ collections, globals });
}

export interface AssemblyInput {
  collections: ImportExportCollections;
  globals: ImportExportGlobals;
}

/** Build the portable document from raw collection/global payloads. */
export function assembleDocument(input: AssemblyInput): ImportExportDocument {
  return {
    collections: input.collections,
    exportedAt: new Date().toISOString(),
    formatVersion: FORMAT_VERSION,
    globals: input.globals,
  };
}

/** Trigger a client-side download of the serialized JSON document. */
export function downloadDocument(doc: ImportExportDocument, filename: string): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
