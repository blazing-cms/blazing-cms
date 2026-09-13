import type { ImportExportDocument, ImportPreview } from "./types";

/**
 * Build a preview of the import document for user selection.
 */
export function buildImportPreview(doc: ImportExportDocument, formatName: string): ImportPreview {
  const collections = Object.entries(doc.collections).map(([slug, entries]) => ({
    count: entries.length,
    selected: true,
    slug,
  }));

  const globals = Object.keys(doc.globals).map((slug) => ({
    count: 0,
    selected: true,
    slug,
  }));

  const totalEntries = collections.reduce((sum, c) => sum + c.count, 0);

  return {
    collections,
    format: formatName,
    globals,
    totalEntries,
  };
}
