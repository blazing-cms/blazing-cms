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

feat(cms): add content import/export

Add the ability to export collection entries and globals into a portable, versioned JSON file for backup or migration, and import such a file back into Firestore. Export normalizes media/upload field values from project-specific Storage URLs to portable paths; import re-resolves them for the target project, validates against the current schema, and writes in non-destructive ≤500-op Firestore batches with progress reporting. UI entry points: per-collection Export in the collections area and a full Content Export/Import flow under Settings.
