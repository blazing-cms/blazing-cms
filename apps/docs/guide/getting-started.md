# Getting Started

## Prerequisites

- Node.js >= 22
- pnpm >= 11

## Create a Project

```bash
pnpm create @blazing-cms/create-app my-cms
cd my-cms
```

If you're starting from the monorepo itself, the playground app serves as a reference:

```bash
cd apps/playground
pnpm dev
```

## Project Structure

```
my-cms/
  cms/
    collections/     # Collection schema files
    globals/         # Global schema files
    components/      # Component schema files
  blazing-cms.config.ts   # Project name + Firebase + capability config
  .env                     # Firebase client credentials (VITE_*)
```

## Define Your First Collection

Create `cms/collections/posts.ts`:

```ts
import { defineCollection, text, slug, richText } from "@blazing-cms/schema";

export const posts = defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  admin: {
    group: "Content",
    useAsTitle: "title",
  },
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    slug("slug", { source: "title", unique: true }),
    richText("content", { label: "Content" }),
  ],
});
```

## Configure Firebase

Blazing CMS is client-only: Firebase Auth, Firestore, Storage, and Hosting are the
entire backend. Set the Firebase client credentials in `.env`:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...
```

Then set the project id in `blazing-cms.config.ts`:

```ts
import { defineConfig } from "@blazing-cms/cms";

export default defineConfig({
  projectName: "My CMS",
  firebase: { projectId: "my-cms" },
});
```

## Start the Dev Server

```bash
pnpm dev
```

This starts the CMS dev server with:

- The admin panel at `http://localhost:5173/`
- Auto-generated types, SDK, validation, Firestore rules, and indexes on startup
- Live reload of schema changes

## What's Next

- [Defining Schemas](/guide/schemas) — collections, globals, components, field types
- [Admin Panel](/guide/admin) — using the generated admin UI
- [Deployment](/guide/deployment) — deploy rules, indexes, and the admin panel to Firebase
