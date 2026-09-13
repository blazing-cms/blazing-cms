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
