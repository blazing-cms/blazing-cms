## 1. Types and data model

- [x] 1.1 Create `packages/cms/src/admin/lib/import-export/types.ts` with `ImportExportDocument` (`formatVersion`, `exportedAt`, `collections`, `globals`), `ImportResult` (`imported`, `skipped`, `errors`), and `ImportProgress` types
- [x] 1.2 Define the shared `ImportExportPayload`/collection + global entry shapes used by both serialize and import paths

## 2. Export implementation

- [x] 2.1 Implement `serialize.ts`: paginate `provider.findMany(slug, { limit, cursor })` until `hasMore === false` to read a complete collection
- [x] 2.2 Read each configured global via `provider.getGlobal(slug)` and include it in the document
- [x] 2.3 Build the export document with `formatVersion: 1` and `exportedAt` ISO timestamp
- [x] 2.4 Implement media `url → path` normalization (`normalize.ts`): build a `url → path` lookup by paginated `findMany("media")` and rewrite `media`/`upload` field values, recursing through structural/composite fields
- [x] 2.5 Add a browser-download helper that serializes the document to a JSON Blob and triggers a download

## 3. Import implementation

- [x] 3.1 Implement `parse.ts`: read the selected file, JSON-parse, and structurally validate `formatVersion`/`collections`/`globals` (reject unsupported version)
- [x] 3.2 Implement per-entry validation against the current collection schema (required fields, type checks) using existing schema/validation helpers; produce per-entry errors
- [x] 3.3 Implement media `path → url` normalization for the target project at import time
- [x] 3.4 Add `importContent(collections, globals): Promise<ImportResult>` to the `DataProvider` interface (`providers/types.ts`)
- [x] 3.5 Implement `importContent` in the `firebase` provider: detect existing doc IDs (skip), chunk into `writeBatch` groups of ≤500 ops, report progress, return `{ imported, skipped }`
- [x] 3.6 Implement `importContent` in the `mock` provider: skip existing in-memory keys, count imported/skipped
- [x] 3.7 Implement `import.ts` orchestration: parse → validate → normalize → `provider.importContent`, with progress callback and result summary

## 4. Admin UI

- [x] 4.1 Add per-collection Export button to the collections area wired to the export flow
- [x] 4.2 Add a Settings content Export/Import flow (export all, file picker for import, progress + result summary UI)
- [x] 4.3 Wire TanStack Query invalidation so imported content refreshes the relevant collection/global queries

## 5. Tests and verification

- [x] 5.1 Unit tests for `serialize.ts` (full pagination, empty collection, timestamp preservation)
- [x] 5.2 Unit tests for media normalization (`url → path` export, `path → url` import, non-matching left unchanged, nested fields)
- [x] 5.3 Unit tests for `parse.ts` (valid file, invalid JSON, unsupported `formatVersion`, missing collections/globals)
- [x] 5.4 Unit tests for `importContent` in the mock provider (skip-existing, counts, validation skips)
- [x] 5.5 Unit tests for Firestore batch chunking logic (500-op batches) in the firebase provider path
- [x] 5.6 Run `pnpm typecheck`, `pnpm test`, and `pnpm eslint` and resolve all findings
