# Defining Schemas

Blazing CMS uses TypeScript schema files as the source of truth. Three types of schemas are available: collections, globals, and components. The schema DSL lives in `@blazing-cms/schema`.

## Collections

Collections represent content types with multiple entries (like database tables).

```ts
import { defineCollection, text, number, boolean, date } from "@blazing-cms/schema";

export const products = defineCollection({
  slug: "products",
  labels: { singular: "Product", plural: "Products" },
  admin: {
    group: "Catalog",
    defaultSort: "-createdAt",
    useAsTitle: "name",
  },
  fields: [
    text("name", { label: "Name", validation: { required: true } }),
    number("price", { label: "Price" }),
    boolean("inStock", { label: "In Stock", defaultValue: true }),
    date("availableFrom", { label: "Available From" }),
  ],
  timestamps: { createdAt: true, updatedAt: true },
});
```

`defineCollection` options:

| Option       | Description                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `slug`       | Unique identifier used for the Firestore collection and routes.                                    |
| `labels`     | `singular` and `plural` display labels.                                                            |
| `fields`     | Field definitions (see below).                                                                     |
| `admin`      | Admin UI settings: `group`, `defaultSort`, `defaultPageSize`, `hide`, `description`, `useAsTitle`. |
| `timestamps` | Add `createdAt`/`updatedAt` to entries (`false` to disable).                                       |
| `workflow`   | Content workflow config (states, transitions, reviewer roles). See [Workflow](/guide/workflow).    |
| `config`     | Per-collection capability overrides. See [Capabilities](/reference/configuration#capabilities).    |
| `versions`   | Versioning hints (`maxPerDoc`, drafts, soft delete, scheduled publishing).                         |

## Globals

Globals represent singleton content (like site settings).

```ts
import { defineGlobal, text, media, color } from "@blazing-cms/schema";

export const siteSettings = defineGlobal({
  slug: "site-settings",
  label: "Site Settings",
  admin: { group: "Settings" },
  fields: [
    text("siteName", { label: "Site Name", validation: { required: true } }),
    media("logo", { label: "Logo", allowedTypes: ["image"] }),
    color("brandColor", { label: "Brand Color" }),
  ],
});
```

## Components

Components are reusable field groups that can be embedded in other schemas.

```ts
import { defineComponent, text, textarea } from "@blazing-cms/schema";

export const seo = defineComponent({
  slug: "seo",
  label: "SEO",
  fields: [
    text("title", { label: "Meta Title" }),
    textarea("description", { label: "Meta Description" }),
  ],
});
```

Use a component in a collection with the `component` or `dynamicZone` field type.

## Field Types

| Type          | Description                     | Builder options                              |
| ------------- | ------------------------------- | -------------------------------------------- |
| `text`        | Single-line text                | `validation`, `label`                        |
| `textarea`    | Multi-line text                 |                                              |
| `richText`    | Rich text editor (Tiptap)       |                                              |
| `markdown`    | Markdown editor                 |                                              |
| `code`        | Code editor (CodeMirror)        |                                              |
| `number`      | Numeric input                   |                                              |
| `boolean`     | Toggle/checkbox                 |                                              |
| `date`        | Date picker                     |                                              |
| `datetime`    | Date and time picker            |                                              |
| `email`       | Email input                     |                                              |
| `password`    | Password input                  |                                              |
| `url`         | URL input                       |                                              |
| `json`        | JSON editor                     |                                              |
| `color`       | Color picker                    | `format` (`hex` \| `rgb` \| `rgba` \| `hsl`) |
| `media`       | Media/file picker               | `multiple`, `allowedTypes`                   |
| `upload`      | File upload                     | `multiple`, `allowedTypes`                   |
| `select`      | Dropdown select                 | `options: [{ label, value }]`                |
| `multiSelect` | Multi-select                    | `options: [{ label, value }]`                |
| `radio`       | Radio buttons                   | `options: [{ label, value }]`                |
| `checkbox`    | Checkbox group                  |                                              |
| `relation`    | Relation to another collection  | `kind` (`manyToOne` \| `manyToMany`), `to`   |
| `component`   | Inline component                | `component` (slug)                           |
| `dynamicZone` | Dynamic zone (choose component) | `components` (slugs)                         |
| `array`       | Repeating array of fields       | `fields`                                     |
| `object`      | Nested object                   | `fields`                                     |
| `group`       | Grouped fields                  | `fields`                                     |
| `repeater`    | Repeatable group                | `fields`                                     |
| `tabs`        | Tabbed interface                | `tabs`                                       |
| `slug`        | Auto-generated slug             | `source`, `unique`                           |

## Validation

Field types accept a `validation` object:

```ts
text("title", {
  label: "Title",
  validation: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: "^[a-zA-Z0-9 ]+$",
  },
});
```

Available validation rules:

| Rule                      | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `required`                | Field must have a value.                               |
| `unique`                  | Value must be unique across the collection.            |
| `min` / `max`             | Numeric bounds.                                        |
| `minLength` / `maxLength` | String length bounds.                                  |
| `pattern`                 | Regex string the value must match.                     |
| `custom`                  | Function returning `true`, or an error message string. |
| `message`                 | Custom error message.                                  |

## Feature Flags on Schemas

Collections and globals can override capability flags with `config.features`.
Only collection-scoped capabilities are allowed: `workflow` and `versioning`
(`versioning` is the only global-scoped one).

```ts
defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  fields: [text("title")],
  // Disable versioning for this collection only
  config: { features: { versioning: false } },
});
```

See [Configuration Reference](/reference/configuration#capabilities) for the full
feature-flag model.
