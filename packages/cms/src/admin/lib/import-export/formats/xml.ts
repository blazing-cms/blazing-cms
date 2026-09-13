// packages/cms/src/admin/lib/import-export/formats/xml.ts

import type { FormatHandler, SerializedOutput } from "./types";

import { type ImportExportDocument, type ImportExportEntry } from "../types";

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

function parseCollections(collectionsElement: Element | null): ImportExportDocument["collections"] {
  const collections: ImportExportDocument["collections"] = {};
  if (!collectionsElement) return collections;

  for (const collectionEl of Array.from(collectionsElement.querySelectorAll("collection"))) {
    const slug = collectionEl.getAttribute("slug") || "";
    if (!slug) continue;

    const entries: ImportExportEntry[] = [];
    for (const entryEl of Array.from(collectionEl.querySelectorAll("entry"))) {
      const id = entryEl.getAttribute("id") || "";
      if (!id) continue;
      entries.push({ id, ...parseXMLElement(entryEl) });
    }

    collections[slug] = entries;
  }
  return collections;
}

function parseGlobals(globalsElement: Element | null): ImportExportDocument["globals"] {
  const globals: ImportExportDocument["globals"] = {};
  if (!globalsElement) return globals;

  for (const globalEl of Array.from(globalsElement.querySelectorAll("global"))) {
    const slug = globalEl.getAttribute("slug") || "";
    if (!slug) continue;
    globals[slug] = parseXMLElement(globalEl);
  }
  return globals;
}

function parseXMLDocument(root: Element): ImportExportDocument {
  return {
    collections: parseCollections(root.querySelector("collections")),
    exportedAt: root.getAttribute("exportedAt") || new Date().toISOString(),
    formatVersion: parseInt(root.getAttribute("formatVersion") || "1", 10),
    globals: parseGlobals(root.querySelector("globals")),
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
  extensions: ["xml"],
  mimeType: "application/xml",
  name: "xml",

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
      extension: "xml",
      mimeType: "application/xml",
    };
  },
};
