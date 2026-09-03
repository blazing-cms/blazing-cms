export const FORMAT_VERSION = 1;

export interface ImportExportEntry {
  id: string;
  [key: string]: unknown;
}

export type ImportExportCollections = Record<string, ImportExportEntry[]>;

export type ImportExportGlobals = Record<string, Record<string, unknown>>;

export interface ImportExportDocument {
  formatVersion: number;
  exportedAt: string;
  collections: ImportExportCollections;
  globals: ImportExportGlobals;
}

export interface ImportError {
  id: string;
  collection: string;
  message: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportProgress {
  total: number;
  /** Number of documents written so far. */
  done: number;
}

/** Shape passed from the import orchestration into the provider's batch writer. */
export interface ImportBatch {
  id: string;
  data: Record<string, unknown>;
}
