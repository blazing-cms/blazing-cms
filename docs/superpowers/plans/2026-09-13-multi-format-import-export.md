# Multi-Format Import/Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CSV and XML import/export support alongside existing JSON, with auto-detection and format selection UI.

**Architecture:** Plugin format handler pattern - each format (JSON, CSV, XML) implements a `FormatHandler` interface with `parse()` and `serialize()` methods. A registry auto-detects format from file extension.

**Tech Stack:** TypeScript, Vitest, React, DOMParser (XML), Papa Parse (CSV via manual implementation)

**Spec:** `docs/superpowers/specs/2026-09-13-multi-format-import-export-design.md`

## Global Constraints

- TypeScript strict mode
- No external dependencies for CSV/XML parsing (implement manually)
- Vitest for testing
- Follow existing code patterns in `packages/cms/src/admin/lib/import-export/`
- All tests must pass before commit

---

## File Structure

### New Files

| File                   | Responsibility                                                |
| ---------------------- | ------------------------------------------------------------- |
| `formats/types.ts`     | FormatHandler interface, SerializedOutput type                |
| `formats/json.ts`      | JSON parser/serializer (extracted from parse.ts/serialize.ts) |
| `formats/csv.ts`       | CSV parser/serializer                                         |
| `formats/xml.ts`       | XML parser/serializer                                         |
| `formats/index.ts`     | Registry, auto-detect, getFormatHandler                       |
| `formats/json.test.ts` | JSON handler tests                                            |
| `formats/csv.test.ts`  | CSV handler tests                                             |
| `formats/xml.test.ts`  | XML handler tests                                             |

### Modified Files

| File                                    | Change                                    |
| --------------------------------------- | ----------------------------------------- |
| `parse.ts`                              | Delegate to format handler                |
| `serialize.ts`                          | Accept format option, delegate to handler |
| `types.ts`                              | Add ExportFormat type                     |
| `index.ts`                              | Export new format utilities               |
| `../../../routes/settings/content.tsx`  | Export dropdown, format badge             |
| `../../../routes/collections/$slug.tsx` | Export dropdown                           |

---

## Tasks

### Task 1: Create Format Handler Interface

**Files:**

- Create: `packages/cms/src/admin/lib/import-export/formats/types.ts`

**Interfaces:**

- Produces: `FormatHandler`, `SerializedOutput` types

- [ ] **Step 1: Create formats directory**

```bash
mkdir -p packages/cms/src/admin/lib/import-export/formats
```

- [ ] **Step 2: Write types.ts**

```typescript
// packages/cms/src/admin/lib/import-export/formats/types.ts

import type { ImportExportDocument } from "../types";

export interface SerializedOutput {
  content: string | Blob;
  mimeType: string;
  extension: string;
}

export interface FormatHandler {
  name: string;
  extensions: string[];
  mimeType: string;

  parse(file: File): Promise<ImportExportDocument>;
  serialize(doc: ImportExportDocument): SerializedOutput;
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/formats/types.ts
git commit -m "feat(import-export): add format handler interface"
```

---

### Task 2: Extract JSON Handler

**Files:**

- Create: `packages/cms/src/admin/lib/import-export/formats/json.ts`
- Create: `packages/cms/src/admin/lib/import-export/formats/json.test.ts`
- Modify: `packages/cms/src/admin/lib/import-export/parse.ts`
- Modify: `packages/cms/src/admin/lib/import-export/serialize.ts`

**Interfaces:**

- Consumes: `FormatHandler` from `formats/types.ts`
- Produces: `jsonHandler` export

- [ ] **Step 1: Write json.ts handler**

```typescript
// packages/cms/src/admin/lib/import-export/formats/json.ts

import type { ImportExportDocument } from "../types";
import { FORMAT_VERSION } from "../types";
import type { FormatHandler, SerializedOutput } from "./types";

function normalizeDocument(raw: unknown): ImportExportDocument {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("The import file has an invalid structure.");
  }

  const source = raw as Record<string, unknown>;
  if (typeof source.formatVersion !== "number") {
    throw new Error("The import file is missing a formatVersion.");
  }
  if (source.formatVersion > FORMAT_VERSION) {
    throw new Error(
      `This file uses format version ${source.formatVersion}, which is newer than supported (${FORMAT_VERSION}).`,
    );
  }

  const collections = source.collections ?? {};
  const globals = source.globals ?? {};
  if (!isStringRecordMap(collections)) {
    throw new Error("The import file's `collections` field is invalid.");
  }
  for (const [slug, entries] of Object.entries(collections)) {
    if (!Array.isArray(entries)) {
      throw new Error(`Collection "${slug}" must contain an array of entries.`);
    }
  }
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
  name: "json",
  extensions: ["json"],
  mimeType: "application/json",

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
      mimeType: "application/json",
      extension: "json",
    };
  },
};
```

- [ ] **Step 2: Write json.test.ts**

```typescript
// packages/cms/src/admin/lib/import-export/formats/json.test.ts

import { describe, expect, it } from "vitest";

import { FORMAT_VERSION } from "../types";
import { jsonHandler } from "./json";

function file(name: string, content: string): File {
  return new File([content], name, { type: "application/json" });
}

describe("jsonHandler", () => {
  describe("parse", () => {
    it("parses a valid export document", async () => {
      const doc = {
        collections: { posts: [{ id: "abc", title: "Hello" }] },
        exportedAt: "2026-01-01T00:00:00.000Z",
        formatVersion: 1,
        globals: { site: { name: "Test" } },
      };
      const result = await jsonHandler.parse(file("export.json", JSON.stringify(doc)));
      expect(result.formatVersion).toBe(1);
      expect(result.collections.posts).toHaveLength(1);
      expect(result.globals.site).toEqual({ name: "Test" });
    });

    it("throws on invalid JSON", async () => {
      await expect(jsonHandler.parse(file("bad.json", "{not valid json"))).rejects.toThrow(
        "not valid JSON",
      );
    });

    it("throws when formatVersion is missing", async () => {
      const doc = { collections: {}, globals: {} };
      await expect(jsonHandler.parse(file("x.json", JSON.stringify(doc)))).rejects.toThrow(
        "formatVersion",
      );
    });
  });

  describe("serialize", () => {
    it("serializes to valid JSON", () => {
      const doc = {
        collections: { posts: [{ id: "1", title: "Hi" }] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: FORMAT_VERSION,
        globals: {},
      };
      const result = jsonHandler.serialize(doc);
      expect(result.mimeType).toBe("application/json");
      expect(result.extension).toBe("json");
      const parsed = JSON.parse(result.content as string);
      expect(parsed.formatVersion).toBe(FORMAT_VERSION);
    });
  });
});
```

- [ ] **Step 3: Run json tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/formats/json.test.ts
```

Expected: PASS

- [ ] **Step 4: Update parse.ts to use jsonHandler**

```typescript
// packages/cms/src/admin/lib/import-export/parse.ts

import { jsonHandler } from "./formats/json";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/** Read a File and parse it into a structurally-valid import document. */
export async function parseImportFile(file: File): Promise<ImportExportDocument> {
  try {
    return await jsonHandler.parse(file);
  } catch (err) {
    if (err instanceof Error) {
      throw new ParseError(err.message);
    }
    throw new ParseError("Failed to parse import file.");
  }
}

export async function parseImportText(text: string): Promise<ImportExportDocument> {
  const file = new File([text], "import.json", { type: "application/json" });
  return parseImportFile(file);
}

// Re-export types for backward compatibility
import type { ImportExportDocument } from "./types";
```

- [ ] **Step 5: Update serialize.ts to use jsonHandler**

```typescript
// packages/cms/src/admin/lib/import-export/serialize.ts

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
import { jsonHandler } from "./formats/json";
import type { FormatHandler, SerializedOutput } from "./formats/types";

const EXPORT_PAGE = 100;

export interface ExportOptions {
  collections?: string[];
  globals?: string[];
  format?: "json" | "csv" | "xml";
}

// ... keep existing loadMediaMaps, normalizeEntry, normalizeGlobal, exportCollection, exportGlobal, buildExport, assembleDocument functions ...

/** Trigger a client-side download of the serialized document. */
export function downloadDocument(
  doc: ImportExportDocument,
  filename: string,
  format?: string,
): void {
  const handler = format === "csv" ? csvHandler : format === "xml" ? xmlHandler : jsonHandler;
  const output = handler.serialize(doc);
  const blob =
    output.content instanceof Blob
      ? output.content
      : new Blob([output.content], { type: output.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 6: Run existing serialize tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/serialize.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/formats/json.ts packages/cms/src/admin/lib/import-export/formats/json.test.ts packages/cms/src/admin/lib/import-export/parse.ts packages/cms/src/admin/lib/import-export/serialize.ts
git commit -m "feat(import-export): extract JSON handler, update parse/serialize to use format handler"
```

---

### Task 3: Implement CSV Parser

**Files:**

- Create: `packages/cms/src/admin/lib/import-export/formats/csv.ts`
- Create: `packages/cms/src/admin/lib/import-export/formats/csv.test.ts`

**Interfaces:**

- Consumes: `FormatHandler` from `formats/types.ts`, `ImportExportDocument` from `../types`
- Produces: `csvHandler` export

- [ ] **Step 1: Write csv.ts parser**

```typescript
// packages/cms/src/admin/lib/import-export/formats/csv.ts

import { FORMAT_VERSION, type ImportExportDocument, type ImportExportEntry } from "../types";
import type { FormatHandler, SerializedOutput } from "./types";

/**
 * Parse a CSV file into an ImportExportDocument.
 * Only supports flat (scalar) fields. Nested fields are skipped with warnings.
 */
function parseCSV(text: string): { entries: ImportExportEntry[]; warnings: string[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    return { entries: [], warnings: [] };
  }

  const headers = parseCSVLine(lines[0]!);
  const entries: ImportExportEntry[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]!);
    const entry: ImportExportEntry = { id: "" };

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j]!;
      const value = values[j] ?? "";

      if (header === "id") {
        entry.id = value;
      } else {
        entry[header] = coerceValue(value);
      }
    }

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
    const char = line[i]!;

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
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
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const csvHandler: FormatHandler = {
  name: "csv",
  extensions: ["csv"],
  mimeType: "text/csv",

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

    for (const [slug, entries] of Object.entries(doc.collections)) {
      if (entries.length === 0) continue;

      const headers = new Set<string>();
      headers.add("id");
      for (const entry of entries) {
        for (const key of Object.keys(entry)) {
          if (key !== "id") headers.add(key);
        }
      }

      const headerArray = Array.from(headers);
      lines.push(headerArray.map(escapeCSVValue).join(","));

      for (const entry of entries) {
        const row = headerArray.map((h) => escapeCSVValue(entry[h]));
        lines.push(row.join(","));
      }

      lines.push("");
    }

    return {
      content: lines.join("\n"),
      mimeType: "text/csv",
      extension: "csv",
    };
  },
};
```

- [ ] **Step 2: Write csv.test.ts**

```typescript
// packages/cms/src/admin/lib/import-export/formats/csv.test.ts

import { describe, expect, it } from "vitest";

import { csvHandler } from "./csv";

function file(name: string, content: string): File {
  return new File([content], name, { type: "text/csv" });
}

describe("csvHandler", () => {
  describe("parse", () => {
    it("parses valid CSV with headers and rows", async () => {
      const csv = "id,title,slug\nabc,Hello World,hello-world\n,Second,second";
      const result = await csvHandler.parse(file("test.csv", csv));
      expect(result.collections._csv_import).toHaveLength(2);
      expect(result.collections._csv_import[0]).toEqual({
        id: "abc",
        title: "Hello World",
        slug: "hello-world",
      });
    });

    it("handles quoted fields with commas", async () => {
      const csv = 'id,title\n1,"Hello, World"';
      const result = await csvHandler.parse(file("test.csv", csv));
      expect(result.collections._csv_import[0]!.title).toBe("Hello, World");
    });

    it("handles escaped quotes", async () => {
      const csv = 'id,title\n1,"Say ""hello"""';
      const result = await csvHandler.parse(file("test.csv", csv));
      expect(result.collections._csv_import[0]!.title).toBe('Say "hello"');
    });

    it("coerces numbers", async () => {
      const csv = "id,count\n1,42";
      const result = await csvHandler.parse(file("test.csv", csv));
      expect(result.collections._csv_import[0]!.count).toBe(42);
    });

    it("coerces booleans", async () => {
      const csv = "id,active\n1,true";
      const result = await csvHandler.parse(file("test.csv", csv));
      expect(result.collections._csv_import[0]!.active).toBe(true);
    });

    it("skips entries missing id", async () => {
      const csv = "id,title\n,Hello";
      const result = await csvHandler.parse(file("test.csv", csv));
      expect(result.collections._csv_import).toHaveLength(0);
    });

    it("returns empty for header-only CSV", async () => {
      const csv = "id,title";
      const result = await csvHandler.parse(file("test.csv", csv));
      expect(result.collections._csv_import).toHaveLength(0);
    });
  });

  describe("serialize", () => {
    it("exports entries to CSV with headers", () => {
      const doc = {
        collections: {
          posts: [
            { id: "1", title: "Hello", slug: "hello" },
            { id: "2", title: "World", slug: "world" },
          ],
        },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = csvHandler.serialize(doc);
      const lines = (result.content as string).split("\n");
      expect(lines[0]).toBe("id,title,slug");
      expect(lines[1]).toBe("1,Hello,hello");
      expect(lines[2]).toBe("2,World,world");
    });

    it("escapes fields with commas", () => {
      const doc = {
        collections: { posts: [{ id: "1", title: "Hello, World" }] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = csvHandler.serialize(doc);
      expect(result.content).toContain('"Hello, World"');
    });

    it("handles empty collections", () => {
      const doc = {
        collections: { posts: [] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = csvHandler.serialize(doc);
      expect(result.content).toBe("");
    });
  });
});
```

- [ ] **Step 3: Run csv tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/formats/csv.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/formats/csv.ts packages/cms/src/admin/lib/import-export/formats/csv.test.ts
git commit -m "feat(import-export): add CSV parser and serializer"
```

---

### Task 4: Implement XML Parser

**Files:**

- Create: `packages/cms/src/admin/lib/import-export/formats/xml.ts`
- Create: `packages/cms/src/admin/lib/import-export/formats/xml.test.ts`

**Interfaces:**

- Consumes: `FormatHandler` from `formats/types.ts`, `ImportExportDocument` from `../types`
- Produces: `xmlHandler` export

- [ ] **Step 1: Write xml.ts parser**

```typescript
// packages/cms/src/admin/lib/import-export/formats/xml.ts

import { FORMAT_VERSION, type ImportExportDocument, type ImportExportEntry } from "../types";
import type { FormatHandler, SerializedOutput } from "./types";

/**
 * Parse XML text into an object by converting child elements to properties.
 */
function parseXMLElement(element: Element): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const child of Array.from(element.children)) {
    const key = child.tagName;
    const value = parseXMLValue(child);

    if (key in result) {
      if (!Array.isArray(result[key])) {
        result[key] = [result[key]];
      }
      (result[key] as unknown[]).push(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Parse the value of an XML element.
 */
function parseXMLValue(element: Element): unknown {
  if (element.children.length === 0) {
    return element.textContent || undefined;
  }
  return parseXMLElement(element);
}

/**
 * Parse XML into ImportExportDocument.
 */
function parseXMLDocument(root: Element): ImportExportDocument {
  const formatVersion = parseInt(root.getAttribute("formatVersion") || "1", 10);
  const exportedAt = root.getAttribute("exportedAt") || new Date().toISOString();

  const collectionsElement = root.querySelector("collections");
  const globalsElement = root.querySelector("globals");

  const collections: ImportExportDocument["collections"] = {};
  if (collectionsElement) {
    for (const collectionEl of Array.from(collectionsElement.querySelectorAll("collection"))) {
      const slug = collectionEl.getAttribute("slug") || "";
      if (!slug) continue;

      const entries: ImportExportEntry[] = [];
      for (const entryEl of Array.from(collectionEl.querySelectorAll("entry"))) {
        const id = entryEl.getAttribute("id") || "";
        if (!id) continue;

        const data = parseXMLElement(entryEl);
        entries.push({ id, ...data });
      }

      collections[slug] = entries;
    }
  }

  const globals: ImportExportDocument["globals"] = {};
  if (globalsElement) {
    for (const globalEl of Array.from(globalsElement.querySelectorAll("global"))) {
      const slug = globalEl.getAttribute("slug") || "";
      if (!slug) continue;

      globals[slug] = parseXMLElement(globalEl);
    }
  }

  return {
    collections,
    exportedAt,
    formatVersion,
    globals,
  };
}

/**
 * Escape special XML characters.
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Serialize a value to XML element string.
 */
function serializeXMLValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    const items = value.map((item) => serializeXMLValue(key.replace(/s$/, ""), item)).join("");
    return items;
  }

  if (typeof value === "object") {
    const children = Object.entries(value)
      .map(([k, v]) => serializeXMLValue(k, v))
      .join("");
    return `<${key}>${children}</${key}>`;
  }

  return `<${key}>${escapeXML(String(value))}</${key}>`;
}

export const xmlHandler: FormatHandler = {
  name: "xml",
  extensions: ["xml"],
  mimeType: "application/xml",

  async parse(file: File): Promise<ImportExportDocument> {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "application/xml");

    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      throw new Error("Invalid XML: " + parseError.textContent);
    }

    const root = doc.documentElement;
    if (root.tagName !== "export") {
      throw new Error("Root element must be <export>");
    }

    return parseXMLDocument(root);
  },

  serialize(doc: ImportExportDocument): SerializedOutput {
    const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
    lines.push(`<export formatVersion="${doc.formatVersion}" exportedAt="${doc.exportedAt}">`);

    lines.push("  <collections>");
    for (const [slug, entries] of Object.entries(doc.collections)) {
      lines.push(`    <collection slug="${escapeXML(slug)}">`);
      for (const entry of entries) {
        lines.push(`      <entry id="${escapeXML(entry.id)}">`);
        for (const [key, value] of Object.entries(entry)) {
          if (key === "id") continue;
          const xml = serializeXMLValue(key, value);
          if (xml) lines.push(`        ${xml}`);
        }
        lines.push("      </entry>");
      }
      lines.push("    </collection>");
    }
    lines.push("  </collections>");

    lines.push("  <globals>");
    for (const [slug, data] of Object.entries(doc.globals)) {
      lines.push(`    <global slug="${escapeXML(slug)}">`);
      for (const [key, value] of Object.entries(data)) {
        const xml = serializeXMLValue(key, value);
        if (xml) lines.push(`      ${xml}`);
      }
      lines.push("    </global>");
    }
    lines.push("  </globals>");

    lines.push("</export>");

    return {
      content: lines.join("\n"),
      mimeType: "application/xml",
      extension: "xml",
    };
  },
};
```

- [ ] **Step 2: Write xml.test.ts**

```typescript
// packages/cms/src/admin/lib/import-export/formats/xml.test.ts

import { describe, expect, it } from "vitest";

import { xmlHandler } from "./xml";

function file(name: string, content: string): File {
  return new File([content], name, { type: "application/xml" });
}

describe("xmlHandler", () => {
  describe("parse", () => {
    it("parses valid XML document", async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<export formatVersion="1" exportedAt="2026-01-01T00:00:00Z">
  <collections>
    <collection slug="posts">
      <entry id="abc">
        <title>Hello</title>
        <slug>hello-world</slug>
      </entry>
    </collection>
  </collections>
  <globals>
    <global slug="site">
      <name>My Site</name>
    </global>
  </globals>
</export>`;
      const result = await xmlHandler.parse(file("export.xml", xml));
      expect(result.formatVersion).toBe(1);
      expect(result.collections.posts).toHaveLength(1);
      expect(result.collections.posts[0]!.title).toBe("Hello");
      expect(result.globals.site.name).toBe("My Site");
    });

    it("throws on invalid XML", async () => {
      const xml = "<invalid><unclosed>";
      await expect(xmlHandler.parse(file("bad.xml", xml))).rejects.toThrow("Invalid XML");
    });

    it("throws when root is not <export>", async () => {
      const xml = `<?xml version="1.0"?><root></root>`;
      await expect(xmlHandler.parse(file("wrong.xml", xml))).rejects.toThrow(
        "Root element must be <export>",
      );
    });

    it("handles nested elements", async () => {
      const xml = `<?xml version="1.0"?>
<export formatVersion="1" exportedAt="2026-01-01T00:00:00Z">
  <collections>
    <collection slug="posts">
      <entry id="1">
        <meta>
          <title>SEO Title</title>
        </meta>
      </entry>
    </collection>
  </collections>
  <globals></globals>
</export>`;
      const result = await xmlHandler.parse(file("export.xml", xml));
      expect(result.collections.posts[0]!.meta).toEqual({ title: "SEO Title" });
    });

    it("handles repeated tags as arrays", async () => {
      const xml = `<?xml version="1.0"?>
<export formatVersion="1" exportedAt="2026-01-01T00:00:00Z">
  <collections>
    <collection slug="posts">
      <entry id="1">
        <tag>a</tag>
        <tag>b</tag>
        <tag>c</tag>
      </entry>
    </collection>
  </collections>
  <globals></globals>
</export>`;
      const result = await xmlHandler.parse(file("export.xml", xml));
      expect(result.collections.posts[0]!.tag).toEqual(["a", "b", "c"]);
    });
  });

  describe("serialize", () => {
    it("exports to valid XML structure", () => {
      const doc = {
        collections: {
          posts: [{ id: "1", title: "Hello" }],
        },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = xmlHandler.serialize(doc);
      expect(result.content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.content).toContain('<export formatVersion="1"');
      expect(result.content).toContain('<collection slug="posts">');
      expect(result.content).toContain('<entry id="1">');
      expect(result.content).toContain("<title>Hello</title>");
    });

    it("escapes HTML content", () => {
      const doc = {
        collections: { posts: [{ id: "1", content: "<p>Hello</p>" }] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = xmlHandler.serialize(doc);
      expect(result.content).toContain("&lt;p&gt;Hello&lt;/p&gt;");
    });

    it("handles nested objects", () => {
      const doc = {
        collections: { posts: [{ id: "1", meta: { title: "SEO" } }] },
        exportedAt: "2026-01-01T00:00:00Z",
        formatVersion: 1,
        globals: {},
      };
      const result = xmlHandler.serialize(doc);
      expect(result.content).toContain("<meta>");
      expect(result.content).toContain("<title>SEO</title>");
    });
  });
});
```

- [ ] **Step 3: Run xml tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/formats/xml.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/formats/xml.ts packages/cms/src/admin/lib/import-export/formats/xml.test.ts
git commit -m "feat(import-export): add XML parser and serializer"
```

---

### Task 5: Create Format Registry

**Files:**

- Create: `packages/cms/src/admin/lib/import-export/formats/index.ts`

**Interfaces:**

- Consumes: `jsonHandler`, `csvHandler`, `xmlHandler` from respective files
- Produces: `detectFormat`, `getFormatHandler`, `handlers` exports

- [ ] **Step 1: Write formats/index.ts**

```typescript
// packages/cms/src/admin/lib/import-export/formats/index.ts

import { csvHandler } from "./csv";
import { jsonHandler } from "./json";
import type { FormatHandler } from "./types";
import { xmlHandler } from "./xml";

export type { FormatHandler, SerializedOutput } from "./types";

export const handlers: FormatHandler[] = [jsonHandler, csvHandler, xmlHandler];

/**
 * Auto-detect format from file extension.
 */
export function detectFormat(filename: string): FormatHandler | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return handlers.find((h) => h.extensions.includes(ext ?? "")) ?? null;
}

/**
 * Get format handler by name.
 */
export function getFormatHandler(name: string): FormatHandler | null {
  return handlers.find((h) => h.name === name) ?? null;
}

export { csvHandler } from "./csv";
export { jsonHandler } from "./json";
export { xmlHandler } from "./xml";
```

- [ ] **Step 2: Update types.ts to add ExportFormat**

```typescript
// packages/cms/src/admin/lib/import-export/types.ts

export const FORMAT_VERSION = 1;

export type ExportFormat = "json" | "csv" | "xml";

// ... keep existing types ...
```

- [ ] **Step 3: Update index.ts to export new utilities**

```typescript
// packages/cms/src/admin/lib/import-export/index.ts

export * from "./types";
export * from "./normalize";
export * from "./parse";
export * from "./validate";
export * from "./serialize";
export * from "./import";
export * from "./batch";
export * from "./formats";
```

- [ ] **Step 4: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/formats/index.ts packages/cms/src/admin/lib/import-export/types.ts packages/cms/src/admin/lib/import-export/index.ts
git commit -m "feat(import-export): add format registry and auto-detect"
```

---

### Task 6: Update parse.ts to Use Format Handler

**Files:**

- Modify: `packages/cms/src/admin/lib/import-export/parse.ts`

**Interfaces:**

- Consumes: `detectFormat` from `./formats`
- Produces: Updated `parseImportFile`

- [ ] **Step 1: Update parse.ts**

```typescript
// packages/cms/src/admin/lib/import-export/parse.ts

import { detectFormat } from "./formats";
import type { ImportExportDocument } from "./types";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/** Read a File and parse it into a structurally-valid import document. */
export async function parseImportFile(file: File): Promise<ImportExportDocument> {
  const handler = detectFormat(file.name);
  if (!handler) {
    throw new ParseError(`Unsupported file format. Supported: .json, .csv, .xml`);
  }

  try {
    return await handler.parse(file);
  } catch (err) {
    if (err instanceof ParseError) throw err;
    if (err instanceof Error) {
      throw new ParseError(err.message);
    }
    throw new ParseError("Failed to parse import file.");
  }
}

export async function parseImportText(text: string): Promise<ImportExportDocument> {
  const file = new File([text], "import.json", { type: "application/json" });
  return parseImportFile(file);
}
```

- [ ] **Step 2: Run existing parse tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/parse.test.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/parse.ts
git commit -m "feat(import-export): update parse to use format handler with auto-detect"
```

---

### Task 7: Update serialize.ts to Accept Format Option

**Files:**

- Modify: `packages/cms/src/admin/lib/import-export/serialize.ts`

**Interfaces:**

- Consumes: `getFormatHandler` from `./formats`, `ExportFormat` from `./types`
- Produces: Updated `downloadDocument`, `buildExport` with format option

- [ ] **Step 1: Update serialize.ts**

```typescript
// packages/cms/src/admin/lib/import-export/serialize.ts

import type { DataProvider } from "@/lib/providers/types";

import { getFormatHandler } from "./formats";
import {
  buildMediaMaps,
  toStoragePath,
  transformFields,
  type FieldSources,
  type MediaMaps,
} from "./normalize";
import {
  FORMAT_VERSION,
  type ExportFormat,
  type ImportExportCollections,
  type ImportExportDocument,
  type ImportExportEntry,
  type ImportExportGlobals,
} from "./types";

const EXPORT_PAGE = 100;

export interface ExportOptions {
  collections?: string[];
  globals?: string[];
  format?: ExportFormat;
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

/** Trigger a client-side download of the serialized document. */
export function downloadDocument(
  doc: ImportExportDocument,
  filename: string,
  format: ExportFormat = "json",
): void {
  const handler = getFormatHandler(format);
  if (!handler) {
    throw new Error(`Unsupported format: ${format}`);
  }

  const output = handler.serialize(doc);
  const blob =
    output.content instanceof Blob
      ? output.content
      : new Blob([output.content], { type: output.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Run serialize tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/serialize.test.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/serialize.ts
git commit -m "feat(import-export): update serialize to accept format option"
```

---

### Task 8: Update Settings Page UI

**Files:**

- Modify: `packages/cms/src/admin/routes/settings/content.tsx`

**Interfaces:**

- Consumes: `detectFormat`, `ExportFormat`, `downloadDocument`
- Produces: Updated export dropdown, format badge in import

- [ ] **Step 1: Update content.tsx with export dropdown and format badge**

```typescript
// packages/cms/src/admin/routes/settings/content.tsx

import { useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { Download, Upload, FileJson, ChevronDown } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { collections, components, globals } from "@/__generated__/schema-registry";
import { useToast } from "@/components/toast-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  buildExport,
  buildFieldSources,
  detectFormat,
  downloadDocument,
  importDocument,
  parseImportFile,
  type ExportFormat,
  type ImportProgress,
  type ImportResult,
} from "@/lib/import-export";
import { useDataProvider } from "@/lib/providers/context";
import { appLayoutRoute } from "@/routes/app-layout";

export const contentToolsRoute = createRoute({
  component: ContentTools,
  getParentRoute: () => appLayoutRoute,
  path: "/settings/content",
});

function ContentTools() {
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fields = buildFieldSources({ collections, components, globals });

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);

  async function handleExport(format: ExportFormat = "json") {
    setExporting(true);
    try {
      const doc = await buildExport(provider, fields);
      const filename = `content-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadDocument(doc, filename, format);
      addToast({ description: `Content exported as ${format.toUpperCase()}.`, title: "Exported" });
    } catch (err) {
      addToast({ description: String(err), title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const format = detectFormat(file.name);
    setDetectedFormat(format?.name ?? null);

    setImporting(true);
    setProgress(null);
    setResult(null);
    setError(null);
    try {
      const doc = await parseImportFile(file);
      const res = await importDocument(provider, doc, fields, (p) => setProgress(p));
      setResult(res);

      for (const slug of Object.keys(doc.collections)) {
        await queryClient.invalidateQueries({ queryKey: ["collection", slug] });
      }
      for (const slug of Object.keys(doc.globals)) {
        await queryClient.invalidateQueries({ queryKey: ["global", slug] });
      }
      await queryClient.invalidateQueries({ queryKey: ["media"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });

      addToast({
        description: `Imported ${res.imported} item(s), skipped ${res.skipped}.`,
        title: "Import complete",
      });
    } catch (err) {
      setError(String(err));
      addToast({ description: String(err), title: "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  const percent =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Export all content for backup or migrate it into another Blazing CMS project.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" /> Export
            </CardTitle>
            <CardDescription>
              Downloads a file containing every collection entry and global.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={exporting}>
                  <Download className="mr-1 h-4 w-4" />
                  {exporting ? "Exporting..." : "Export all content"}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => void handleExport("json")}>
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON (full fidelity)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport("csv")}>
                  CSV (flat fields only)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport("xml")}>
                  XML (full fidelity)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Import
            </CardTitle>
            <CardDescription>
              Restore from an exported file. Existing entries from the source are merged or
              skipped rather than overwritten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.xml,application/json,text/csv,application/xml"
              className="hidden"
              onChange={(e) => void handleImportFile(e)}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <FileJson className="mr-1 h-4 w-4" />
                {importing ? "Importing..." : "Choose file to import"}
              </Button>
              {detectedFormat && (
                <Badge variant="secondary">{detectedFormat.toUpperCase()}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {importing && progress && (
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            <span>Importing...</span>
            <span>
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Import failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Import summary
              {detectedFormat && (
                <Badge variant="outline">{detectedFormat.toUpperCase()}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Imported <span className="font-medium text-foreground">{result.imported}</span>{" "}
              item(s) and skipped{" "}
              <span className="font-medium text-foreground">{result.skipped}</span> (already exist
              or failed validation).
            </p>
            {result.errors.length > 0 && (
              <div className="max-h-60 overflow-auto rounded-md border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {result.errors.length} skipped item(s)
                </p>
                <ul className="space-y-1 text-xs">
                  {result.errors.slice(0, 50).map((err, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="shrink-0 font-mono text-muted-foreground">
                        {err.collection}/{err.id}
                      </span>
                      <span>{err.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd packages/cms && npm run typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/cms/src/admin/routes/settings/content.tsx
git commit -m "feat(import-export): add export dropdown and format badge to settings UI"
```

---

### Task 9: Update Collection Detail Page UI

**Files:**

- Modify: `packages/cms/src/admin/routes/collections/$slug.tsx`

**Interfaces:**

- Consumes: `ExportFormat`, `downloadDocument`
- Produces: Updated export dropdown

- [ ] **Step 1: Update $slug.tsx with export dropdown**

```typescript
// packages/cms/src/admin/routes/collections/$slug.tsx

import { useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Download, Plus, FileText, ChevronDown } from "lucide-react";
import { useState } from "react";

import { collections, components, globals } from "@/__generated__/schema-registry";
import { useToast } from "@/components/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  assembleDocument,
  buildFieldSources,
  downloadDocument,
  exportCollection,
  type ExportFormat,
} from "@/lib/import-export";
import { useDataProvider } from "@/lib/providers/context";
import { usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const collectionDetailRoute = createRoute({
  component: CollectionEntries,
  getParentRoute: () => appLayoutRoute,
  path: "/collections/$slug",
});

function CollectionEntries() {
  const { slug } = collectionDetailRoute.useParams();
  const provider = useDataProvider();
  const { addToast } = useToast();
  const { can } = usePermissions();
  const col = collections.find((c) => c.slug === slug);
  const canCreate = can("create", slug);

  const { data: entries, isLoading } = useQuery({
    queryFn: async () => {
      const result = await provider.findMany(slug, { limit: 50 });
      return result.data;
    },
    queryKey: ["collection", slug],
  });

  const [exporting, setExporting] = useState(false);
  const fields = buildFieldSources({ collections, components, globals });

  async function handleExport(format: ExportFormat = "json") {
    setExporting(true);
    try {
      const rows = await exportCollection(provider, slug, fields);
      const doc = assembleDocument({ collections: { [slug]: rows }, globals: {} });
      const filename = `${slug}-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadDocument(doc, filename, format);
      addToast({
        description: `Exported ${rows.length} entry(ies) from "${slug}" as ${format.toUpperCase()}.`,
        title: "Exported",
      });
    } catch (err) {
      addToast({ description: String(err), title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  if (!col) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Collection not found</h2>
        <p className="text-muted-foreground">Collection "{slug}" is not defined in your schema.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{col.labels?.singular ?? slug}</h1>
          <p className="text-muted-foreground text-sm">/{slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Download className="mr-1 h-4 w-4" />
                {exporting ? "Exporting..." : "Export"}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => void handleExport("json")}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExport("csv")}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExport("xml")}>
                XML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate ? (
            <Link to="/collections/new/$slug" params={{ slug }}>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> New Entry
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to="/collections/$slug/$id"
              params={{ id: entry.id as string, slug }}
            >
              <div className="flex items-center justify-between rounded-md border p-3 hover:bg-muted">
                <div>
                  <p className="font-medium">{(entry as Record<string, unknown>).title as string ?? entry.id}</p>
                  <p className="text-sm text-muted-foreground">/{entry.id}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">No entries yet.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd packages/cms && npm run typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/cms/src/admin/routes/collections/\$slug.tsx
git commit -m "feat(import-export): add export dropdown to collection detail page"
```

---

### Task 10: Run All Tests

**Files:**

- None (verification only)

- [ ] **Step 1: Run all import-export tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/
```

Expected: All tests PASS

- [ ] **Step 2: Run full test suite**

```bash
cd packages/cms && npm test
```

Expected: All tests PASS

- [ ] **Step 3: Run typecheck**

```bash
cd packages/cms && npm run typecheck
```

Expected: PASS

- [ ] **Step 4: Run lint**

```bash
cd packages/cms && npm run lint
```

Expected: PASS

---

### Task 11: Final Commit

- [ ] **Step 1: Check git status**

```bash
git status
```

- [ ] **Step 2: Stage all changes**

```bash
git add -A
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(import-export): complete multi-format support (CSV, XML) with auto-detect UI"
```

---

## Spec Coverage Check

| Spec Requirement                  | Task    |
| --------------------------------- | ------- |
| Format handler interface          | Task 1  |
| JSON handler extraction           | Task 2  |
| CSV parser                        | Task 3  |
| CSV serializer                    | Task 3  |
| XML parser                        | Task 4  |
| XML serializer                    | Task 4  |
| Format registry + auto-detect     | Task 5  |
| Updated parse pipeline            | Task 6  |
| Updated serialize pipeline        | Task 7  |
| Settings page export dropdown     | Task 8  |
| Settings page import format badge | Task 8  |
| Collection detail export dropdown | Task 9  |
| All tests pass                    | Task 10 |

All spec requirements covered.
