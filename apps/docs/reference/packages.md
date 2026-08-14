# Packages

Blazing CMS is organized as a monorepo with the following packages:

| Package                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `@blazing-cms/cms`         | Admin panel + CLI (dev, build, generate) |
| `@blazing-cms/schema`      | Schema definition DSL                    |
| `@blazing-cms/core`        | Core container, event bus, lifecycle     |
| `@blazing-cms/permissions` | Role-based access control                |
| `@blazing-cms/generators`  | Code generation (types, SDK, validation) |
| `@blazing-cms/validation`  | Zod-based schema validation              |
| `@blazing-cms/plugins`     | Plugin registry                          |
| `@blazing-cms/sdk`         | Browser SDK for content consumption      |
| `@blazing-cms/types`       | Shared TypeScript types                  |
| `@blazing-cms/create-app`  | Project scaffolding CLI                  |

## @blazing-cms/cms

The main package containing the admin panel UI and CLI commands.

### CLI Commands

```bash
blaze dev          # Start dev server
blaze build        # Build for production
blaze generate     # Generate types, SDK, validation, rules, indexes
blaze deploy       # Deploy to Firebase Hosting
blaze scaffold     # Scaffold a new collection, global, or component
blaze lint         # Lint schema files
blaze doctor       # Check project health
```

## @blazing-cms/schema

Schema definition DSL for collections, globals, and components.

```ts
import { defineCollection, text } from "@blazing-cms/schema";
```

## @blazing-cms/sdk

Browser SDK for consuming CMS content directly from Firestore, including the
capability APIs.

```ts
import { createBlazeClient } from "@blazing-cms/sdk";

const client = createBlazeClient({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
});

// Access collections by name
const posts = await client.collection("posts").findMany();
const post = await client.collection("posts").findById("abc123");

// Access globals
const settings = await client.globals.get("site-settings");

// Auth, analytics, media, rbac, versions, workflow, notifications
await client.auth.login("admin@example.com", "password");
const summary = await client.analytics.getSummary({ period: "30d" });
const assets = await client.media.list({ folder: "banners" });
const roles = await client.rbac.listRoles();
const versions = await client.versions.list({ kind: "entry", collection: "posts", id: post.id });
await client.workflow.transition("posts", post.id, "review");
const inbox = await client.notifications.list();
```

See the [SDK Reference](/reference/sdk) for the full API.

## @blazing-cms/types

Shared TypeScript types: schema definitions (collections, globals, components,
fields, workflow config) and capability configuration.

## @blazing-cms/create-app

Project scaffolding CLI (`@blazing-cms/create-app <project-name>`) that creates a
project with Firebase config, example collections and globals, and
build/dev/deploy scripts.
