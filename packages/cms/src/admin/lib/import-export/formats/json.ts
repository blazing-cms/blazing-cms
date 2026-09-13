import type { ImportExportDocument } from "../types";
import type { FormatHandler, SerializedOutput } from "./types";

import { FORMAT_VERSION } from "../types";

function validateFormatVersion(source: Record<string, unknown>): void {
  if (typeof source.formatVersion !== "number") {
    throw new Error("The import file is missing a formatVersion.");
  }
  if (source.formatVersion > FORMAT_VERSION) {
    throw new Error(
      `This file uses format version ${source.formatVersion}, which is newer than supported (${FORMAT_VERSION}).`,
    );
  }
}

function validateCollections(collections: unknown): void {
  if (!isStringRecordMap(collections)) {
    throw new Error("The import file's `collections` field is invalid.");
  }
  for (const [slug, entries] of Object.entries(collections)) {
    if (!Array.isArray(entries)) {
      throw new Error(`Collection "${slug}" must contain an array of entries.`);
    }
  }
}

function normalizeDocument(raw: unknown): ImportExportDocument {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("The import file has an invalid structure.");
  }

  const source = raw as Record<string, unknown>;
  validateFormatVersion(source);

  const collections = source.collections ?? {};
  const globals = source.globals ?? {};
  validateCollections(collections);

  if (!isStringRecordMap(globals)) {
    throw new Error("The import file's `globals` field is invalid.");
  }

  return {
    collections: collections as unknown as ImportExportDocument["collections"],
    exportedAt:
      typeof source.exportedAt === "string" ? source.exportedAt : new Date().toISOString(),
    formatVersion: FORMAT_VERSION,
    globals: globals as unknown as ImportExportDocument["globals"],
  };
}

function isStringRecordMap(value: unknown): value is Record<string, Record<string, unknown>[]> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export const jsonHandler: FormatHandler = {
  extensions: ["json"],
  mimeType: "application/json",
  name: "json",

  async parse(file: File): Promise<ImportExportDocument> {
    const text = await file.text();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error("The file is not valid JSON.");
    }
    return normalizeDocument(raw);
  },

  serialize(doc: ImportExportDocument): SerializedOutput {
    return {
      content: JSON.stringify(doc, null, 2),
      extension: "json",
      mimeType: "application/json",
    };
  },
};
