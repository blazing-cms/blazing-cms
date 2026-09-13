## Context

See proposal.md for motivation and scope (content only: entries + globals; both backup and cross-project migration).

Blazing CMS is a client-side-only CMS. The admin panel is a React 19 SPA (`packages/cms/src/admin`) and talks to Firestore exclusively through the Firebase client SDK. All data access goes through a `DataProvider` abstraction (`packages/cms/src/admin/lib/providers/types.ts`) with two implementations: `firebase` (browser Firestore) and `mock` (in-memory Map for dev/tests). Content lives in `collections_<slug>` Firestore collections and `globals_<slug>/value` documents. Media library items are stored in `collections_media` and each record carries both `url` (a project-specific Firebase Storage download URL) and `path` (the portable Storage path). A `media`/`upload` field value in an entry stores `item.url`.

Key constraints driving the design:

- **No backend**: all read/write must use existing client SDK patterns (the SDK/media code already uses `writeBatch`).
- **Portable file**: because the primary uses are backup _and_ migration, exported media references must not be pinned to the source project's bucket.
- **Provider parity**: export/import must work identically in `firebase` and `mock` modes so the logic is testable without a network.

## Goals / Non-Goals

**Goals:**

- A versioned, self-contained JSON format (`formatVersion: 1`) for all content.
- Complete (unpaginated) read of a collection for export, preserving IDs and timestamps.
- Media `media`/`upload` values normalized to Storage `path` on export and re-resolved to target-project URLs on import.
- Non-destructive import: skip existing IDs, validate against the current schema, write in ≤500-op Firestore batches with progress and a result summary.
- Admin entry points: per-collection Export and a Settings full Export/Import flow, in both provider modes.

**Non-Goals:**

- Exporting media **blobs**/files (they move separately, e.g., Firebase Storage copy/migration) or schema definitions.
- Deep relational remapping of IDs (we preserve original IDs, so relations stay intact); import is per-project non-destructive.
- Server-side/streaming export of arbitrarily huge datasets; import is client-side batched.

## Decisions

### D1. New module `packages/cms/src/admin/lib/import-export/`

Export/import logic lives in a dedicated module under the admin lib, kept out of the generated SDK because it is admin-panel behavior (schema-aware, provider-relative). Files:

- `types.ts` — `ImportExportDocument`, `ImportResult`, `ImportProgress` types.
- `serialize.ts` — build the export document from provider reads.
- `parse.ts` — parse + structural-validate a selected file.
- `normalize.ts` — media `url ↔ path` rewriting via schema-aware traversal.
- `import.ts` — orchestrate validate → normalize → batched write via the provider.

**Alternative considered:** placing logic in the `sdk` package for reuse. Rejected: the SDK has no schema-awareness or React context and shouldn't know about the admin schema registry; keeping it in the admin keeps the batch/skip logic beside the providers that implement it.

### D2. Portable format (formatVersion 1)

```
{
  "formatVersion": 1,
  "exportedAt": "2026-09-03T...Z",
  "collections": { "posts": [ { "id": "...", "title": "...", "heroImage": "media/pic.png", "createdAt": "...", "updatedAt": "..." } ] },
  "globals": { "site-settings": { "id": "value", "...": "..." } }
}
```

Each entry carries its original Firestore `id` plus its data (including timestamps). Unknown `formatVersion` fails import.

### D3. Export reads through the existing provider (no new read API needed)

Export paginates `provider.findMany(slug, { limit, cursor })` until `hasMore === false`, concatenating pages; it then `getGlobal(slug)` for every configured global. This reuses the existing `DataProvider` surface. **No new provider read method required** — keeps the change smaller.

### D4. Media normalization is schema-aware and done in the module

A traversal walks each entry's data according to the collection schema field tree; whenever it reaches a `media`/`upload` field it applies a mapping built from a `url → path` / `path → url` lookup of the media library (read once via paginated `findMany("media")`).

- **Export**: `url → path` (portable).
- **Import**: `path → url` for the target project (resolved against target media records).
  Values that don't match either side are left unchanged, satisfying the "non-matching value left as-is" scenario. Recursion covers `array`/`object`/`group`/`repeater`/`component`/`dynamicZone`.

**Alternative considered:** naive string-replace of the bucket URL prefix. Rejected: fragile (needs the source bucket known) and can't reliably re-resolve `path → url` at import; the record-grounded lookup is robust.

### D5. Import adds a `DataProvider.importContent` method

Rather than reaching into Firestore from the UI module, add one method to the `DataProvider` interface (`types.ts`):
`importContent(collections, globals): Promise<ImportResult>`.

- **firebase** (`firebase.ts`): for each target doc, first `get` to detect existing IDs (skip-existing), then chunk all writes into `writeBatch` groups of ≤500 ops and report `{ imported, skipped }` via a callback. Timestamps for new docs default to the exported ones (preserved), with `updatedAt` set to export value for fidelity.
- **mock** (`mock.ts`): same semantics against its in-memory Map (skip existing keys, count imported/skipped).

This keeps Firestore batching and mock parity inside the providers, matching the existing pattern where `media.ts` uses `writeBatch` and providers own storage details.

### D6. Validation happens against the current schema before writing

The module validates each imported entry against its collection's field definitions (required fields, type checks) using the existing schema validator facilities (`@blazing-cms/schema` validator and/or shared `validation` helpers). Invalid entries are counted as skipped with an error and not written, satisfying the validation scenario without coupling import to UI form components.

## Risks / Trade-offs

- **Download-URL portability is best-effort.** Normalization only rewrites values that match a media record's URL/path. Media whose record is missing from the source/target library is left unchanged.
  → Mitigation: document that media library records must be present for references to remap; on migration the media records migrate too (they're just collection content).
- **"Read all" scales linearly with content size.** Exporting a very large collection paginates many Firestore reads in the browser; large files load fully into memory before download.
  → Mitigation: acceptable for a CMS admin panel; progress can reflect pages read. Chunked/JSONL streaming (below) is deferred.
- **Skip-existing is idempotent but not overwrite-capable.** Users can't force-overwrite brands/records that already exist in the target.
  → Mitigation: out of scope for v1; overwrite semantics can be a future `option` without changing the format.
- **Large exports could exceed in-browser limits.**
  → Trade-off noted; a `jsonl`/streaming variant is an open follow-up, not required for v1.
- **Schema drift between environments** could cause many validation skips during migration.
  → Mitigation: per-entry validation reports precise errors; the result summary counts skipped entries so users see what didn't land.

## Migration Plan

- New capability is additive and backward-compatible: existing content and provider behavior unchanged. Export/import are opt-in UI actions.
- Rollback: removing the new module, provider method, and setting routes restores the prior behavior; no data migration is required since import is non-destructive and operates only on content the user explicitly selects.

## Open Questions

- Export/import of `media` **records and folders** as part of the content payload (they are themselves collection docs) — can be decided later without changing the format or approach; v1 focus is user collections and globals.
- A streaming `JSONL` export/import variant for very large datasets, to be layered on later if needed.
