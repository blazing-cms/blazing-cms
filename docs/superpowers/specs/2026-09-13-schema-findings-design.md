# Schema Findings & Improvements Design

**Date:** 2026-09-13
**Status:** Approved
**Scope:** Bug fixes + features across @blazing-cms/schema, @blazing-cms/types, @blazing-cms/generators, and @blazing-cms/cms

## Background

Audit of `@blazing-cms/cms@0.3.4` / `@blazing-cms/schema@0.3.4` while building the web-cms-schema change. Found 4 errors, 5 package proposals, and 10+ feature limitations.

## Phase 1: Bug Fixes

### 1.1 Export SelectOption

**What:** Add `SelectOption` type to `@blazing-cms/types` and re-export from `@blazing-cms/schema`.

**Files:**

- `packages/types/src/fields.ts` — add `export type SelectOption = { label: string; value: string }`
- `packages/schema/src/index.ts` — re-export `SelectOption` from types
- `packages/schema/src/fields.ts` — change local `type SelectOption` to import from types

**Impact:** Schema authors can now `import { SelectOption } from '@blazing-cms/schema'` to type shared option arrays.

### 1.2 Extension Probing in SchemaLoader

**What:** Add extension resolution to `SchemaLoader.loadFromDir()` so `import ... from '../lib/options'` works without explicit `.ts`.

**Resolution order:**

1. Exact path as-is (for `.js` imports)
2. `${path}.ts`
3. `${path}.tsx`
4. `${path}.js`
5. `${path}/index.ts`
6. `${path}/index.js`

**Files:**

- `packages/schema/src/loader.ts` — add `resolveImportPath()` helper, use in `tryLoadFile()`

**Impact:** Schema authors can use normal TS-style imports without specifying extensions.

### 1.3 Scaffold validation.required Fix

**What:** Update collection scaffold template to use the documented `validation.required` API instead of top-level `required`.

**Before (broken under strict TS):**

```ts
text("title", { required: true });
```

**After:**

```ts
text("title", { validation: { required: true } });
```

**Files:**

- `packages/generators/src/scaffold.ts` (or equivalent template file)
- `packages/create-app/templates/` (starter collection template)

**Impact:** Generated starter files typecheck under `strict: true`. Matches AGENTS.md documentation.

### 1.4 Generator Exit-on-Error

**What:** Make `blaze generate` exit non-zero when schema files fail to load, instead of silently producing a partial registry.

**Changes:**

1. `SchemaLoader.load()` returns `{ collections, globals, components, errors: string[] }`
2. `blaze generate` checks `errors.length > 0` after loading
3. If errors exist: print them clearly, exit with code 1
4. Generation is skipped (no partial registry written)

**Files:**

- `packages/schema/src/loader.ts` — add `errors` array to `SchemaResult`, populate on import failures
- `packages/cms/src/commands/generate.ts` — check errors, call `process.exit(1)` if present

**Impact:** Schema errors are no longer silent. Users see which files failed and why.

## Phase 2: Features

### 2.1 RichText Toolbar Presets

**What:** Add `toolbar` option to `richText()` builder with named presets.

**Presets:**

- `'minimal'` — bold, italic, heading
- `'basic'` — minimal + links, lists, quotes
- `'full'` — basic + images, tables, code blocks (current default behavior)

**Files:**

- `packages/types/src/fields.ts` — add `toolbar?: 'minimal' | 'basic' | 'full'` to `RichTextField`
- `packages/schema/src/fields.ts` — add `toolbar` parameter to `richText()` builder

**Usage:**

```ts
richText("content"); // defaults to 'full'
richText("sidebar", { toolbar: "minimal" });
```

### 2.2 Relation Field Example

**What:** Add a `relation()` field example to the schema to document the pattern.

**Approach:** Add `department` relation field to the `teachers` collection:

```ts
// collections/teachers.ts
relation("department", { to: "departments", kind: "manyToOne" });
```

**Files:**

- `src/cms/collections/teachers.ts` — add `department` field
- `src/cms/collections/departments.ts` — create if not exists

### 2.3 DynamicZone Usage Pattern

**What:** Add a `content-blocks` dynamic zone component set for flexible page layouts.

**Components to create:**

- `content-blocks/hero` — headline, subtitle, background image
- `content-blocks/faq` — question/answer pairs
- `content-blocks/cta` — call-to-action with link

**Usage in pages:**

```ts
// collections/pages.ts
dynamicZone("blocks", {
  components: ["content-blocks/hero", "content-blocks/faq", "content-blocks/cta"],
});
```

**Files:**

- `src/cms/components/content-blocks/hero.ts`
- `src/cms/components/content-blocks/faq.ts`
- `src/cms/components/content-blocks/cta.ts`
- `src/cms/collections/pages.ts` — add `blocks` dynamic zone

### 2.4 Reusable SEO Component

**What:** Create a `seo-meta` component with `metaTitle` and `metaDescription`, embeddable in any collection.

**Component definition:**

```ts
// components/seo-meta.ts
defineComponent({
  slug: "seo-meta",
  label: "SEO Meta",
  fields: [
    text("metaTitle", { validation: { maxLength: 60 } }),
    textarea("metaDescription", { validation: { maxLength: 160 } }),
  ],
});
```

**Usage:**

```ts
// collections/posts.ts
component("seo", { component: "seo-meta" });
```

**Files:**

- `src/cms/components/seo-meta.ts` — new component
- `src/cms/collections/posts.ts` — embed seo-meta
- `src/cms/collections/teachers.ts` — embed seo-meta
- `src/cms/collections/pages.ts` — replace inline meta fields with seo-meta

### 2.5 Boolean Field for Featured/Pinned

**What:** Add `boolean('featured')` to `posts` and `teachers` collections.

**Usage:**

```ts
boolean("featured", { defaultValue: false });
```

**Files:**

- `src/cms/collections/posts.ts` — add `featured` field
- `src/cms/collections/teachers.ts` — add `featured` field

### 2.6 Datetime Field for Publish Dates

**What:** Add `datetime('publishedAt')` to `posts` and `teachers` for chronological ordering.

**Usage:**

```ts
datetime("publishedAt");
```

**Files:**

- `src/cms/collections/posts.ts` — add `publishedAt` field
- `src/cms/collections/teachers.ts` — add `publishedAt` field

### 2.7 Array Field for Simple Lists

**What:** Add `array('tags')` to `posts` for simple string lists without component overhead.

**Usage:**

```ts
array("tags", { fields: [text("tag")] });
```

**Files:**

- `src/cms/collections/posts.ts` — add `tags` field

### 2.8 Code Field Documentation

**What:** Document the `code()` field builder in AGENTS.md.

**Content to add:**

- `code()` accepts a language option for syntax highlighting
- Example: `code('snippet', { language: 'javascript' })`
- Document supported languages from the code field type definition

**Files:**

- `AGENTS.md` — add code field section

### 2.9 admin.description Documentation

**What:** Document `admin.description` as a universal field option in AGENTS.md.

**Content to add:**

- Every field builder accepts `admin: { description: 'Help text shown in CMS' }`
- Example: `text('title', { admin: { description: 'The main heading' } })`

**Files:**

- `AGENTS.md` — add admin.description section

### 2.10 Validation Options Documentation

**What:** Document all `FieldValidation` options in AGENTS.md with per-field-type examples.

**Content to add:**

- `required`, `unique`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `message`, `custom`
- Per-type examples for text, number, email/url, richText

**Files:**

- `AGENTS.md` — add validation section

### 2.11 Default Values on Text Fields

**What:** Document `defaultValue` option for text fields in AGENTS.md.

**Content to add:**

- `text('title', { defaultValue: 'Untitled' })`
- Works on all field types

**Files:**

- `AGENTS.md` — add defaultValue section

## Verification

After implementation:

1. Run `pnpm typecheck` across all packages
2. Run `pnpm test` across all packages
3. Run `fallow audit` — should pass with no new findings
4. Test `blaze generate` with a broken schema file — should exit non-zero
5. Test `blaze generate` with extensionless imports — should resolve correctly
6. Verify generated schema-registry includes all new fields/components
7. Run `blaze generate` twice — verify `firestore.indexes.json` unchanged on second run
