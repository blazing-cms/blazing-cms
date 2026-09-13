import type { ImportExportDocument } from "./types";

import { detectFormat } from "./formats";

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
