# Blazing CMS

**Schema-defined CMS for Firebase.** Define your content models in TypeScript — get a full admin panel, typed client SDK, runtime validation, and Firestore security rules, all generated automatically.

```ts
// cms/collections/posts.ts
import { defineCollection, text, slug, richText } from "@blazing-cms/schema";

export const posts = defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    slug("slug", { source: "title", unique: true }),
    richText("body", { label: "Content" }),
  ],
});
```

## Features

- **Schema-as-source-of-truth** — collections, globals, and components defined in TypeScript; types, validation, SDK, Firestore rules, and indexes are generated from them
- **Auto-generated admin panel** — full CRUD UI with rich text (Tiptap), markdown, and code (CodeMirror) editors, plus a command palette
- **Typed client SDK** — `@blazing-cms/sdk` for typed content consumption and every capability API
- **Capabilities** — content, content workflow, versioning, media library, RBAC, analytics, and notifications, toggled per project or per schema
- **Firebase backend** — Firestore storage, Firebase Auth, and generated security rules backed by an RBAC grants model
- **Zod validation** — runtime validation generated from schema field rules
- **Plugin system** — extend with custom plugins
- **CLI** — `dev`, `build`, `generate`, `deploy`, `scaffold`, `lint`, `doctor`

## Packages

| Package                    | Description                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `@blazing-cms/cms`         | Admin panel + CLI (`dev`, `build`, `generate`, `deploy`, …)                                   |
| `@blazing-cms/schema`      | Schema definition DSL (`defineCollection`, `defineGlobal`, `defineComponent`, field builders) |
| `@blazing-cms/sdk`         | Browser SDK for typed content consumption + capability APIs                                   |
| `@blazing-cms/core`        | Core container, event bus, lifecycle hooks                                                    |
| `@blazing-cms/permissions` | Role-based access control                                                                     |
| `@blazing-cms/generators`  | Code generation (types, SDK, validation)                                                      |
| `@blazing-cms/validation`  | Zod-based validation generated from schemas                                                   |
| `@blazing-cms/plugins`     | Plugin registry and hooks                                                                     |
| `@blazing-cms/types`       | Shared TypeScript types                                                                       |
| `@blazing-cms/create-app`  | Project scaffolding CLI                                                                       |

## Getting Started

```bash
pnpm create @blazing-cms/create-app my-cms
cd my-cms
pnpm dev
```

This creates a project with Firebase config, example collections and globals,
and build/dev/deploy scripts. Set your Firebase credentials in `.env`
(`VITE_FIREBASE_*`) and your project id in `blazing-cms.config.ts`.

The admin panel is served at `http://localhost:5173/`. For local development
without a Firebase project, `VITE_BACKEND_MODE=mock` uses an in-memory backend;
set it to `firebase` to sync schemas and use live Firestore.

## Documentation

Full docs live in the [docs app](apps/docs) and cover:

- [Getting Started](apps/docs/guide/getting-started.md)
- [Defining Schemas](apps/docs/guide/schemas.md)
- [Admin Panel](apps/docs/guide/admin.md)
- [Media Library](apps/docs/guide/media.md)
- [RBAC](apps/docs/guide/rbac.md)
- [Content Versioning](apps/docs/guide/versioning.md)
- [Content Workflow](apps/docs/guide/workflow.md)
- [Analytics](apps/docs/guide/analytics.md)
- [Deployment](apps/docs/guide/deployment.md)
- [Reference](apps/docs/reference) — packages, CLI, SDK, configuration, security

## Development

```bash
# Install dependencies
pnpm install

# Start dev server with playground app
pnpm dev:playground

# Run tests
pnpm test
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Code quality
pnpm fallow
pnpm knip

# Docs
pnpm docs:dev
pnpm docs:build
```

## License

MIT
