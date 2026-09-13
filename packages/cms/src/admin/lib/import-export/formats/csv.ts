import type { FormatHandler, SerializedOutput } from "./types";

import { FORMAT_VERSION, type ImportExportDocument, type ImportExportEntry } from "../types";

function parseCSVRow(line: string, headers: string[]): ImportExportEntry {
  const values = parseCSVLine(line);
  const entry: ImportExportEntry = { id: "" };

  for (let j = 0; j < headers.length; j++) {
    const header = headers[j];
    if (header === undefined) continue;
    const value = values[j] ?? "";
    if (header === "id") {
      entry.id = value;
    } else {
      entry[header] = coerceValue(value);
    }
  }

  return entry;
}

/**
 * Parse a CSV file into an ImportExportDocument.
 * Only supports flat (scalar) fields. Nested fields are skipped with warnings.
 */
function parseCSV(text: string): { entries: ImportExportEntry[]; warnings: string[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return { entries: [], warnings: [] };

  const headerLine = lines[0];
  if (!headerLine) return { entries: [], warnings: [] };

  const headers = parseCSVLine(headerLine);
  const entries: ImportExportEntry[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const entry = parseCSVRow(line, headers);
    if (!entry.id) {
      warnings.push(`Row ${i + 1}: missing id, skipping`);
      continue;
    }
    entries.push(entry);
  }

  return { entries, warnings };
}

/**
 * Parse a single CSV line, handling quoted fields.
 * RFC 4180 compliant.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === undefined) break;

    if (inQuotes) {
      if (char === '"') {
        const nextChar = line[i + 1];
        if (nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Coerce string value to appropriate type based on content.
 */
function coerceValue(value: string): unknown {
  if (value === "") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;

  const num = Number(value);
  if (!isNaN(num) && value.trim() !== "") return num;

  return value;
}

/**
 * Escape a value for CSV output.
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const csvHandler: FormatHandler = {
  extensions: ["csv"],
  mimeType: "text/csv",
  name: "csv",

  async parse(file: File): Promise<ImportExportDocument> {
    const text = await file.text();
    const { entries, warnings } = parseCSV(text);

    if (warnings.length > 0) {
      console.warn("CSV import warnings:", warnings);
    }

    return {
      collections: { _csv_import: entries },
      exportedAt: new Date().toISOString(),
      formatVersion: FORMAT_VERSION,
      globals: {},
    };
  },

  serialize(doc: ImportExportDocument): SerializedOutput {
    const lines: string[] = [];

    for (const entries of Object.values(doc.collections)) {
      if (entries.length === 0) continue;

      const headers = new Set<string>();
      headers.add("id");
      for (const entry of entries) {
        for (const key of Object.keys(entry)) {
          if (key !== "id") headers.add(key);
        }
      }

      const headerArray = Array.from(headers).sort();
      lines.push(headerArray.map(escapeCSVValue).join(","));

      for (const entry of entries) {
        const row = headerArray.map((h) => escapeCSVValue(entry[h]));
        lines.push(row.join(","));
      }

      lines.push("");
    }

    return {
      content: lines.join("\n"),
      extension: "csv",
      mimeType: "text/csv",
    };
  },
};
