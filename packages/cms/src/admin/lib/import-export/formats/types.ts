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
