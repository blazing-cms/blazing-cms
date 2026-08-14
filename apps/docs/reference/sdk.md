# SDK Reference

The `@blazing-cms/sdk` package is the client-side API for reading and writing
content, media, roles, versions, workflow, and analytics. It wraps Firebase
Auth, Firestore, and Storage.

## Setup

```ts
import { createBlazeClient } from "@blazing-cms/sdk";

const client = createBlazeClient({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});
```

The client is a singleton backed by a single Firebase app. All APIs below are
lazily initialized and cached.

### Client config

| Option           | Description                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiKey`         | Firebase web API key.                                                                                                                                          |
| `authDomain`     | Firebase auth domain.                                                                                                                                          |
| `projectId`      | Firebase project id.                                                                                                                                           |
| `storageBucket`  | Firebase storage bucket.                                                                                                                                       |
| `appId`          | Firebase web app id.                                                                                                                                           |
| `measurementId?` | Optional Analytics measurement id.                                                                                                                             |
| `features?`      | Resolved capability flags. A disabled capability keeps its API surface but returns empty results; writes throw `CAPABILITY_DISABLED`. Defaults to all enabled. |
| `analytics?`     | `{ enabled?, staleTimeMs? }` analytics options.                                                                                                                |
| `media?`         | `{ maxFileSize? }` max upload bytes (default 20 MB).                                                                                                           |

### Raw instances

`client.app`, `client.db`, and `client.storage` expose the underlying Firebase
app, Firestore, and Storage for advanced use.

## Auth

```ts
const user = await client.auth.login("admin@example.com", "password");
client.auth.onAuthChange((user) => {});
await client.auth.logout();
const current = client.auth.getCurrentUser();
```

## Collections

`client.collection(name)` returns a CRUD API for a Firestore collection:

```ts
const posts = client.collection("posts");

// Query with filters, ordering, and pagination
const page = await posts.findMany({
  filters: [{ field: "published", op: "==", value: true }],
  orderBy: { field: "createdAt", direction: "desc" },
  limit: 20,
});
// { data, hasMore, cursor? }

// Filters support ==, !=, >, >=, <, <=, in, not-in, array-contains, array-contains-any

const post = await posts.findById("abc123");

const id = await posts.create({ title: "Hello" });
await posts.update(id, { title: "Hello world" });
await posts.delete(id);
```

## Globals

```ts
const settings = await client.globals.get("site-settings");
await client.globals.upsert("site-settings", { siteName: "My Site" });
```

## Analytics

See [Analytics](/guide/analytics).

```ts
const summary = await client.analytics.getSummary({ period: "30d" });
const counts = await client.analytics.getContentCounts();
const perCollection = await client.analytics.getContentByCollection();
const changes = await client.analytics.getContentChangesOverTime({ period: "7d" });
const storage = await client.analytics.getStorageUsage();
const activity = await client.analytics.getUserActivity();
```

## Media

See [Media](/guide/media).

```ts
const items = await client.media.list({ folder: "banners", tag: "hero", search: "logo" });
const item = await client.media.get(id);
const uploaded = await client.media.upload(file, { folder: "banners", onProgress: (p) => {} });
await client.media.update(id, { altText: "Logo", tags: ["brand"] });
const replaced = await client.media.replace(id, newFile);
const usage = await client.media.usage(id, ["posts", "pages"]);
await client.media.remove(id);

const folders = await client.media.folders.list();
const folder = await client.media.folders.create("Banners", null);
await client.media.folders.rename(folder.id, "Heroes");
await client.media.folders.remove(folder.id);
```

## RBAC

See [RBAC](/guide/rbac).

```ts
const roles = await client.rbac.listRoles();
const role = await client.rbac.getRole("role-editor");
await client.rbac.createRole({
  name: "Editor",
  permissions: {
    collections: { posts: { create: true, read: true, update: true } },
    system: { manageMedia: true },
  },
});
await client.rbac.updateRole("role-editor", { description: "Edits posts" });
await client.rbac.deleteRole("role-editor");

const assignment = await client.rbac.getUserRoles(uid);
await client.rbac.assignRoles(uid, ["role-editor", "role-moderator"]);
```

## Versioning

See [Versioning](/guide/versioning).

```ts
const target = { kind: "entry", collection: "posts", id: postId };
const versions = await client.versions.list(target);
const v = await client.versions.get(target, versionId);
const diff = await client.versions.diff(target, versionA, versionB);
await client.versions.restore(target, versionA);
const removed = await client.versions.prune(target, { keep: 20, olderThanDays: 90 });
await client.versions.remove(target, versionId);

// Globals target by slug
const globalTarget = { kind: "global", slug: "site-settings" };
```

## Workflow

See [Workflow](/guide/workflow).

```ts
await client.workflow.transition("posts", postId, "in_review", { comment: "Please review" });
await client.workflow.assignReviewer("posts", postId, reviewerUid);
const history = await client.workflow.history("posts", postId);
```

## Notifications

```ts
const notifications = await client.notifications.list({ limit: 10 });
await client.notifications.markRead(notifications.map((n) => n.id));
```

## Errors

The SDK exports `BlazeError`, `NotFoundError`, and `ValidationError`. Capability
disables throw `BlazeError` with code `CAPABILITY_DISABLED`.

```ts
import { BlazeError } from "@blazing-cms/sdk";

try {
  await client.media.upload(file);
} catch (err) {
  if (err instanceof BlazeError && err.code === "CAPABILITY_DISABLED") {
    // media is disabled
  }
}
```
