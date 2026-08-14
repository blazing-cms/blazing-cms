# Content Versioning

Versioning keeps a snapshot of every content document before each update, so you
can review what changed, compare any two versions, and roll back. It works for
both collection entries and globals, entirely client-side over Firestore
subcollections.

## Enabling Versioning

Versioning is enabled by default. Configure retention in
`blazing-cms.config.ts`:

```ts
import { defineConfig } from "@blazing-cms/cms";

export default defineConfig({
  capabilities: {
    versioning: {
      enabled: true,
      maxPerDoc: 50, // keep at most 50 versions per document
    },
  },
});
```

`maxPerDoc` sets the default retention cap (the SDK's `prune` defaults to keeping
20 when not specified). Versioning can be disabled per collection (or per global)
via `config.features`:

```ts
defineCollection({
  slug: "logs",
  labels: { singular: "Log", plural: "Logs" },
  fields: [text("message")],
  config: { features: { versioning: false } },
});
```

## How Snapshots Work

- **On update** — the SDK's `collection.update` snapshots the current document
  state to the versions subcollection _before_ applying the update. Each snapshot
  records its version number, author, timestamp, and a change summary
  (e.g. "Edited", "Restored to version N").
- **On create/upsert** — creating an entry or upserting a global stores the
  initial state as version 1.

## In the Admin Panel

The entry editor shows a **Version History** button when the collection has
versioning enabled. It opens the revisions page:

- **Timeline** — chronological list of versions (number, author, timestamp, summary)
- **Compare** — select any two versions for a side-by-side diff highlighting
  added, removed, and changed fields
- **Single view** — view the full document state at a specific version (read-only)
- **Rollback** — restore any previous version; the current state is snapshotted
  first, so rollback is reversible
- **Delete** — remove specific versions

## Retention & Pruning

- **Count-based** — only the newest `maxPerDoc` (or `maxVersions`) versions are
  kept; older versions are pruned client-side on each new version creation.
- **Age-based** — versions older than a configured retention window can be pruned
  via Firestore TTL policies (platform feature, not a Cloud Function).

## SDK Usage

```ts
import { createBlazeClient } from "@blazing-cms/sdk";

const client = createBlazeClient({/* firebase config */});

// An entry in the "posts" collection
const target = { kind: "entry", collection: "posts", id: postId };
// or a global
const globalTarget = { kind: "global", slug: "site-settings" };

// List versions (newest first)
const versions = await client.versions.list(target);

// Diff two versions
const diff = await client.versions.diff(target, versionA, versionB);

// Roll back (snapshots current state first, then restores)
await client.versions.restore(target, versionA);

// Prune to the newest 20, dropping anything older than 90 days
const removed = await client.versions.prune(target, { keep: 20, olderThanDays: 90 });

// Delete a single version
await client.versions.remove(target, versionId);
```

## Data Model

| Firestore path                                 | Purpose                   |
| ---------------------------------------------- | ------------------------- |
| `collections_<slug>/{id}/versions/{versionId}` | Entry version snapshots.  |
| `globals_<slug>/value/versions/{versionId}`    | Global version snapshots. |

Version subcollections are readable by users with read grant on the parent and
writable by users with update grant, enforced in the generated Firestore rules.

## Disabling Versioning

When `versioning` is disabled for a collection, the admin hides the Version
History button and route (showing a "Version history is disabled" notice) and the
SDK's `client.versions` reads return empty results while writes throw
`CAPABILITY_DISABLED`.
