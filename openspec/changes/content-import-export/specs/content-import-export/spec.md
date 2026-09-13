## Purpose

Lets users take their Blazing CMS content (collection entries and globals) out of Firestore into a portable, versioned JSON file for backup or migration, and restore/import that content back into any project — all from the client-side admin UI without a backend.

## ADDED Requirements

### Requirement: Portable export format

The system SHALL produce a self-contained, versioned JSON document representing CMS content that can be read back by the import feature. The document SHALL declare its `formatVersion` so that future format changes can be detected.

#### Scenario: Export document carries a version

- **WHEN** content is exported
- **THEN** the resulting JSON includes a `formatVersion` field and an `exportedAt` ISO timestamp

#### Scenario: Export documents group collections and globals

- **WHEN** content is exported
- **THEN** the JSON contains a `collections` map keyed by collection slug with an array of entries per slug, and a `globals` map keyed by global slug

#### Scenario: Unsupported format version is rejected

- **WHEN** a file is imported whose `formatVersion` is not supported
- **THEN** import fails with a clear error identifying the unsupported version

### Requirement: Export all entries of a collection

The system SHALL export every entry of a selected collection into the portability document, preserving each entry's document ID and timestamps.

#### Scenario: Export a full collection

- **WHEN** a user exports the "posts" collection
- **THEN** the export document contains every "posts" entry, each with its original Firestore document ID included

#### Scenario: Export preserves timestamps

- **WHEN** entries are exported
- **THEN** each entry retains its `createdAt` and `updatedAt` values

#### Scenario: Export fetches beyond the first page

- **WHEN** a collection has more entries than a single Firestore query page
- **THEN** the export follows pagination and includes all entries

#### Scenario: Export an empty collection

- **WHEN** a selected collection has no entries
- **THEN** the export document contains an empty list for that collection slug

### Requirement: Export globals

The system SHALL export every configured global's stored value into the portability document.

#### Scenario: Export all globals

- **WHEN** a user performs a full export
- **THEN** the export document contains each global's value keyed by global slug

### Requirement: Media field values are normalized to storage paths on export

The system SHALL rewrite `media` and `upload` field values in exported entries from project-specific Firebase Storage download URLs to their stable Storage `path`, so exported content is not pinned to the source project's bucket.

#### Scenario: Media download URL is replaced by its path

- **WHEN** an exported entry has a `media`/`upload` field whose value matches a known media library record's download URL
- **THEN** the exported value is replaced with that record's Storage `path`

#### Scenario: Non-matching media value is left unchanged

- **WHEN** a `media`/`upload` field value does not match a known media record
- **THEN** the exported value is left as-is

#### Scenario: Nested media values are normalized

- **WHEN** a media value appears inside structural fields such as `array`, `object`, `group`, `repeater`, `component`, or `dynamicZone`
- **THEN** the exported value is normalized recursively

### Requirement: Import content from a JSON file

The system SHALL read a portability JSON file selected by the user and write its collections and globals into Firestore.

#### Scenario: Import writes collection entries

- **WHEN** a valid portability file containing collection entries is imported
- **THEN** each entry is written to its `collections_<slug>` Firestore collection

#### Scenario: Import writes globals

- **WHEN** a valid portability file containing globals is imported
- **THEN** each global value is written to its `globals_<slug>` document

#### Scenario: Import validates against the current schema

- **WHEN** an imported entry does not conform to the current collection schema (missing required field, invalid type)
- **THEN** the entry is reported as skipped with a validation error rather than written

#### Scenario: Import of an invalid file is rejected

- **WHEN** the selected file is not valid portability JSON
- **THEN** import produces an error and writes nothing

### Requirement: Import preserves original document IDs

The system SHALL write imported entries using their original document IDs, so relationships between entries (relation fields referencing target document IDs) remain intact.

#### Scenario: Entry is created with its original ID

- **WHEN** an imported entry includes its original document ID
- **THEN** the entry is written under that document ID

### Requirement: Import is non-destructive on existing documents

The system SHALL NOT overwrite an existing document during import. When an imported entry's document ID already exists in the target collection, the system SHALL skip that entry and report it as skipped.

#### Scenario: Existing document is skipped

- **WHEN** an imported entry's document ID already exists in the target collection
- **THEN** the existing document is left unchanged and the import reports the entry as skipped

#### Scenario: New documents are added alongside existing ones

- **WHEN** importing entries whose IDs do not already exist alongside entries whose IDs do
- **THEN** the new entries are created and the existing entries are skipped

### Requirement: Media paths are re-resolved to download URLs on import

The system SHALL resolve normalized media Storage `path` values back to target-project download URLs during import, so imported entries reference media in the current project.

#### Scenario: Media path is resolved to a target-project URL

- **WHEN** an imported entry has a `media`/`upload` field whose value is a Storage `path` matching a media library record in the target project
- **THEN** the stored value is replaced with that record's download URL

#### Scenario: Media path without a matching record is left as path

- **WHEN** an imported `media`/`upload` field value is a Storage `path` that does not match a target-project media record
- **THEN** the value is stored as the path unchanged

### Requirement: Import writes in Firestore batches

The system SHALL write imported content in Firestore batches of at most 500 operations each, and SHALL report progress as batches complete.

#### Scenario: Large imports are chunked into batches

- **WHEN** an import contains more documents than a single Firestore batch allows
- **THEN** the documents are written in multiple batches of at most 500 operations each

#### Scenario: Progress is reported during import

- **WHEN** an import runs
- **THEN** the user sees progress reflecting the number of documents written relative to the total

### Requirement: Import reports a result summary

The system SHALL report counts of imported and skipped documents after import completes.

#### Scenario: Result counts are shown

- **WHEN** an import finishes
- **THEN** the user sees the number of entries/globals imported and the number skipped (due to existing IDs or validation failures)

### Requirement: Admin UI provides export and import entry points

The system SHALL surface export and import controls in the admin panel: per-collection Export, and a full Content Export/Import flow under Settings.

#### Scenario: Export a collection from the collection list

- **WHEN** a user selects "Export" on a collection from the collections area
- **THEN** the admin downloads the portability file containing that collection's entries (and optionally the globals)

#### Scenario: Full export from Settings

- **WHEN** a user triggers "Export" from the Settings content area
- **THEN** the admin downloads a portability file containing all collections and globals

#### Scenario: Import a file from Settings

- **WHEN** a user selects a portability file in the Settings content area
- **THEN** the admin validates and imports it, then shows the result summary
