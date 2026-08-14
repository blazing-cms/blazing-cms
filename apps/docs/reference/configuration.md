# Configuration Reference

The project is configured with a `blazing-cms.config.ts` file plus environment
variables loaded from `.env`.

## Config File

```ts
import { defineConfig } from "@blazing-cms/cms";

export default defineConfig({
  projectName: "My CMS",
  firebase: {
    projectId: "my-cms",
    apiKey: "AIza...",
    authDomain: "my-cms.firebaseapp.com",
    storageBucket: "my-cms.appspot.com",
    appId: "1:...:web:...",
  },
  capabilities: {
    analytics: { enabled: true, staleTimeMs: 300_000 },
    media: { enabled: true, maxFileSize: 25 * 1024 * 1024 },
    versioning: { enabled: true, maxPerDoc: 50 },
    workflow: { enabled: true },
    notifications: { enabled: true },
    rbac: { enabled: true },
    content: { enabled: true },
  },
});
```

### `projectName`

Display name shown in the admin panel. Optional.

### `firebase`

`projectId` is required. `apiKey`, `authDomain`, `storageBucket`, and `appId`
can be set here or in `.env` as `VITE_FIREBASE_*` variables.

## Capabilities

Capabilities are the named feature areas of the CMS. Each can be toggled with an
`enabled` flag and carries capability-specific settings. **Everything defaults to
enabled**, so omitting config preserves the current behavior.

| Capability      | Settings                 | Description                                                          |
| --------------- | ------------------------ | -------------------------------------------------------------------- |
| `content`       | `enabled`                | Collections and globals CRUD.                                        |
| `analytics`     | `enabled`, `staleTimeMs` | Dashboard statistics; `staleTimeMs` is result-freshness in ms.       |
| `media`         | `enabled`, `maxFileSize` | Media library; `maxFileSize` caps uploads in bytes (default 20 MB).  |
| `versioning`    | `enabled`, `maxPerDoc`   | Content versioning; `maxPerDoc` caps retained versions per document. |
| `workflow`      | `enabled`                | Content workflow states and transitions.                             |
| `notifications` | `enabled`                | In-app notifications.                                                |
| `rbac`          | `enabled`                | Roles, user assignments, and grants.                                 |

### Per-Schema Overrides

Collections and globals can override capability flags via `config.features`.
Only genuinely collection-scoped capabilities are allowed:

- Collections: `workflow`, `versioning`
- Globals: `versioning`

```ts
defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  fields: [text("title")],
  config: { features: { workflow: false } },
});
```

A per-schema override wins over the project-wide flag.

### Behavior When Disabled

A disabled capability keeps its API surface but is inert:

- **Admin UI** — nav links and routes are hidden (e.g. the Analytics link, Media
  link, Users/Roles links, Version History button, workflow panel)
- **SDK** — read methods return empty results; write methods throw a
  `BlazeError` with code `CAPABILITY_DISABLED`

## Environment Variables

Loaded from `.env` via dotenv at the root of the project.

| Variable                       | Required | Purpose                                                                                 |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------- |
| `VITE_BACKEND_MODE`            | dev      | `firebase` (real backend) or `mock` (in-memory). Defaults to `mock` for the dev server. |
| `VITE_FIREBASE_API_KEY`        | firebase | Firebase web API key.                                                                   |
| `VITE_FIREBASE_AUTH_DOMAIN`    | firebase | Firebase auth domain.                                                                   |
| `VITE_FIREBASE_PROJECT_ID`     | firebase | Firebase project id.                                                                    |
| `VITE_FIREBASE_STORAGE_BUCKET` | firebase | Firebase storage bucket.                                                                |
| `VITE_FIREBASE_APP_ID`         | firebase | Firebase web app id.                                                                    |

When `VITE_BACKEND_MODE=firebase`, schema sync runs automatically on generation
and the admin panel uses live Firestore.

## Schema Configuration

Collections, globals, and components are defined in TypeScript files under
`cms/collections/`, `cms/globals/`, and `cms/components/`. See
[Defining Schemas](/guide/schemas).

The `@blazing-cms/schema` package provides `defineCollection`, `defineGlobal`,
`defineComponent`, and the field builders (`text`, `number`, `slug`, `media`,
`relation`, `component`, `dynamicZone`, ...). Field types and validation rules are
documented in [Defining Schemas](/guide/schemas).
