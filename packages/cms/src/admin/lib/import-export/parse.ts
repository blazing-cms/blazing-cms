import {
  FORMAT_VERSION,
  type ImportExportCollections,
  type ImportExportDocument,
  type ImportExportGlobals,
} from "./types";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/** Read a File and parse it into a structurally-valid import document. */
export async function parseImportFile(file: File): Promise<ImportExportDocument> {
  const text = await file.text();
  return parseImportText(text);
}

export async function parseImportText(text: string): Promise<ImportExportDocument> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ParseError("The file is not valid JSON.");
  }
  return normalizeDocument(raw);
}

function normalizeDocument(raw: unknown): ImportExportDocument {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ParseError("The import file has an invalid structure.");
  }

  const source = raw as Record<string, unknown>;
  if (typeof source.formatVersion !== "number") {
    throw new ParseError("The import file is missing a formatVersion.");
  }
  if (source.formatVersion > FORMAT_VERSION) {
    throw new ParseError(
      `This file uses format version ${source.formatVersion}, which is newer than supported (${FORMAT_VERSION}).`,
    );
  }

  const collections = source.collections ?? {};
  const globals = source.globals ?? {};
  if (!isStringRecordMap(collections)) {
    throw new ParseError("The import file's `collections` field is invalid.");
  }
  for (const [slug, entries] of Object.entries(collections)) {
    if (!Array.isArray(entries)) {
      throw new ParseError(`Collection "${slug}" must contain an array of entries.`);
    }
  }
  if (!isStringRecordMap(globals)) {
    throw new ParseError("The import file's `globals` field is invalid.");
  }

  return {
    collections: collections as unknown as ImportExportCollections,
    exportedAt:
      typeof source.exportedAt === "string" ? source.exportedAt : new Date().toISOString(),
    formatVersion: FORMAT_VERSION,
    globals: globals as unknown as ImportExportGlobals,
  };
}

function isStringRecordMap(value: unknown): value is Record<string, Record<string, unknown>[]> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
