// packages/cms/src/admin/lib/import-export/formats/index.ts

import type { FormatHandler } from "./types";

import { csvHandler } from "./csv";
import { jsonHandler } from "./json";
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
