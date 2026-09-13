## Why

Blazing CMS currently offers no way to move content between environments or safeguard it. Users can edit Firestore documents but cannot export their collections and globals to a backup file, nor restore/import that content into another project. A client-side-only CMS with Firestore as the sole store needs a portable, format-versioned mechanism to back up and migrate content without a backend.

## What Changes

- Add a **content export** capability: serialize collection entries and globals into a self-contained, versioned JSON file for browser download.
- Add a **content import** capability: read such a file, validate it against the current schema, and write entries/globals back into Firestore.
- **Portable format**: the export file preserves original Firestore document IDs and timestamps, so relations stay intact and backups are faithful. The format carries a `formatVersion` for forward compatibility.
- **Media references normalized on export**: `media`/`upload` field values, which currently store project-specific Firebase Storage download URLs, are rewritten to their stable Storage `path` on export and re-resolved to download URLs in the target project on import.
- **Non-destructive import**: when an imported entry's document ID already exists, the import skips it (merge/skip semantics) rather than overwriting.
- **Batch writes**: imports write via Firestore batches (≤500 ops each) with progress reporting so large datasets import without server help.
- **Admin UI entry points**: per-collection Export buttons and a full-project Export/Import flow under Settings.

## Capabilities

### New Capabilities

- `content-import-export`: Exporting collection entries and globals into a portable, versioned JSON file, and importing that file back into Firestore with schema validation, media-reference normalization, non-destructive conflict handling, and batched writes. This includes reading all entries of a collection into a portable payload (export) and writing many entries at once in batches (import), plus the admin UI entry points (per-collection export, Settings full export/import).

## Impact

- **Affected code**: `packages/cms` (admin routes: `routes/collections/*`, `routes/settings/*`; new `lib/import-export/*` module; data providers for read-all and batch-write operations), `packages/sdk` (possible helpers for reading all entries / resolving media paths), `packages/schema` (field-type traversal to normalize media values and validate imported data).
- **Format**: a new file format (`formatVersion: 1`) produced by export and consumed by import; a shared serializer/parser module used by both directions.
- **No new backend**: remains fully client-side; uses the existing Firebase client SDK (`getDocs`, `writeBatch`) and browser File/Blob APIs.
- **Dependencies**: no new package dependencies expected (uses existing Firebase, TanStack Query, lucide icons, ui components).
