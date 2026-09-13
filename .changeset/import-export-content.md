---
"@blazing-cms/cms": minor
"@blazing-cms/core": minor
"@blazing-cms/create-app": minor
"@blazing-cms/generators": minor
"@blazing-cms/permissions": minor
"@blazing-cms/plugins": minor
"@blazing-cms/schema": minor
"@blazing-cms/sdk": minor
"@blazing-cms/types": minor
"@blazing-cms/validation": minor
---

feat(cms): add content import/export with multi-format support

Add the ability to export collection entries and globals into a portable, versioned JSON file for backup or migration, and import such a file back into Firestore. Export normalizes media/upload field values from project-specific Storage URLs to portable paths; import re-resolves them for the target project, validates against the current schema, and writes in non-destructive ≤500-op Firestore batches with progress reporting.

**Multi-format support:** Export and import now support JSON (full fidelity), CSV (flat fields only), and XML (full fidelity) via a format handler registry with auto-detection from file extensions.

**Import UX enhancements:** Import now shows a preview step with summary counts per collection/global, checkboxes for selective import, and select all/deselect all controls. Users can choose exactly which items to import before committing.

**Per-item export:** Settings page now includes dropdown menus to export individual collections or globals, in addition to the full content export.
