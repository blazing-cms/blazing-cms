import type { DataProvider } from "@/lib/providers/types";

import {
  buildMediaMaps,
  toDownloadUrl,
  transformFields,
  type FieldSources,
  type MediaMaps,
} from "./normalize";
import {
  type ImportBatch,
  type ImportError,
  type ImportExportDocument,
  type ImportProgress,
  type ImportResult,
} from "./types";
import { validateEntry, type EntryValidationError } from "./validate";

const IMPORT_PAGE = 100;

async function loadMediaMaps(provider: DataProvider): Promise<MediaMaps> {
  const records: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const page = await provider.findMany("media", { cursor, limit: IMPORT_PAGE });
    records.push(...page.data);
    cursor = page.cursor;
    hasMore = page.hasMore;
  }
  return buildMediaMaps(records);
}

interface PreparedImport {
  collections: Record<string, ImportBatch[]>;
  globals: Record<string, Record<string, unknown>>;
  errors: ImportError[];
  /** Entries/globals skipped by validation, not written. */
  preSkipped: number;
}

/**
 * Validate entries/globals against the current schema and normalize media
 * Storage paths to this project's download URLs. Invalid documents are dropped
 * and reported; valid ones are prepared for `provider.importContent`.
 */
export function prepareImport(
  doc: ImportExportDocument,
  fields: FieldSources,
  maps: MediaMaps,
): PreparedImport {
  const collections: Record<string, ImportBatch[]> = {};
  const errors: ImportError[] = [];
  let preSkipped = 0;

  for (const [slug, entries] of Object.entries(doc.collections)) {
    const fieldDefs = fields.collections[slug];
    const batches: ImportBatch[] = [];

    for (const entry of entries) {
      const { id, ...data } = entry;
      if (typeof id !== "string" || !id) {
        preSkipped += 1;
        errors.push({ collection: slug, id: String(id), message: "Entry is missing an id." });
        continue;
      }

      if (!fieldDefs) {
        preSkipped += 1;
        errors.push({ collection: slug, id, message: "Collection is not configured." });
        continue;
      }

      const validationErrors: EntryValidationError[] = validateEntry(
        data,
        fieldDefs,
        fields.components,
      );
      if (validationErrors.length > 0) {
        preSkipped += 1;
        errors.push({
          collection: slug,
          id,
          message: validationErrors.map((e) => `${e.path}: ${e.message}`).join("; "),
        });
        continue;
      }

      const normalized = transformFields(data, fieldDefs, fields, toDownloadUrl(maps)) as Record<
        string,
        unknown
      >;
      batches.push({ data: normalized, id });
    }

    collections[slug] = batches;
  }

  const globals: Record<string, Record<string, unknown>> = {};
  for (const [slug, data] of Object.entries(doc.globals)) {
    const fieldDefs = fields.globals[slug];
    if (!fieldDefs) {
      preSkipped += 1;
      errors.push({ collection: slug, id: slug, message: "Global is not configured." });
      continue;
    }
    const normalized = transformFields(data, fieldDefs, fields, toDownloadUrl(maps));
    globals[slug] = normalized as Record<string, unknown>;
  }

  return { collections, errors, globals, preSkipped };
}

/** Full import flow: parse -> validate -> normalize -> provider.importContent. */
export async function importDocument(
  provider: DataProvider,
  doc: ImportExportDocument,
  fields: FieldSources,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportResult> {
  const maps = await loadMediaMaps(provider);
  const prepared = prepareImport(doc, fields, maps);

  const result = await provider.importContent(prepared.collections, prepared.globals, onProgress);

  return {
    errors: [...prepared.errors, ...result.errors],
    imported: result.imported,
    skipped: result.skipped + prepared.preSkipped,
  };
}
