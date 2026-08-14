# Blazing CMS

**Schema-defined CMS for Firebase.** Define your content models in TypeScript — get a full admin panel, typed SDK, and Firestore sync, all generated automatically.

```ts
import { defineCollection, text, slug, richText } from "@blazing-cms/schema";

export const posts = defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  fields: [
    text("title", { validation: { required: true } }),
    slug("slug", { source: "title", unique: true }),
    richText("body"),
  ],
});
```

## Why Blazing CMS?

- **Schema-as-source-of-truth** — collections, globals, and components defined in TypeScript
- **Auto-generated admin panel** — full CRUD with rich text, code, and markdown editors
- **Auto-generated client SDK** — typed browser SDK for content consumption
- **Firebase backend** — Firestore storage, Firebase Auth, generated security rules and indexes
- **Capabilities** — content, workflow, versioning, media, RBAC, analytics, and notifications, toggled per project or per schema

## Guide

- [Getting Started](/guide/getting-started)
- [Defining Schemas](/guide/schemas)
- [Admin Panel](/guide/admin)
- [Media Library](/guide/media)
- [Role-Based Access Control](/guide/rbac)
- [Content Versioning](/guide/versioning)
- [Content Workflow](/guide/workflow)
- [Analytics](/guide/analytics)
- [Deployment](/guide/deployment)

## Reference

- [Packages](/reference/packages)
- [CLI](/reference/cli)
- [SDK](/reference/sdk)
- [Configuration](/reference/configuration)
- [Security](/reference/security)

## Quick Start

```bash
pnpm create @blazing-cms/create-app my-cms
cd my-cms
pnpm dev
```

Head to [Getting Started](/guide/getting-started) to define your first collection.
