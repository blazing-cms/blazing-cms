# Schema Findings & Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 bugs and add 11 features across @blazing-cms/types, @blazing-cms/schema, @blazing-cms/generators, and @blazing-cms/cms packages.

**Architecture:** Phase 1 fixes bugs (SelectOption export, extension probing, scaffold validation, generator error handling). Phase 2 adds features (richText presets, relation example, dynamicZone pattern, SEO component, boolean/datetime/array fields, documentation).

**Tech Stack:** TypeScript, Vitest, Node.js ESM loader, zod (peer dep)

**Spec:** `docs/superpowers/specs/2026-09-13-schema-findings-design.md`

## Global Constraints

- All changes must pass `pnpm typecheck` and `pnpm test` across all packages
- All changes must pass `fallow audit` with no new findings
- Follow existing code patterns in each package
- No breaking changes to public API (additive only)

---

## Phase 1: Bug Fixes

### Task 1: Export SelectOption from @blazing-cms/types

**Files:**

- Modify: `packages/types/src/fields.ts` (add type export)
- Modify: `packages/schema/src/index.ts` (re-export)
- Modify: `packages/schema/src/fields.ts` (import instead of local type)

**Interfaces:**

- Consumes: None
- Produces: `SelectOption` type exported from both packages

- [ ] **Step 1: Add SelectOption type to @blazing-cms/types**

```typescript
// packages/types/src/fields.ts
export type SelectOption = { label: string; value: string };
```

- [ ] **Step 2: Re-export SelectOption from @blazing-cms/schema**

```typescript
// packages/schema/src/index.ts
export type { SelectOption } from "@blazing-cms/types";
```

- [ ] **Step 3: Update schema fields.ts to import SelectOption**

```typescript
// packages/schema/src/fields.ts
import type { SelectOption } from "@blazing-cms/types";
// Remove local type definition
```

- [ ] **Step 4: Run typecheck and tests**

```bash
cd packages/types && pnpm typecheck
cd packages/schema && pnpm typecheck && pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/fields.ts packages/schema/src/index.ts packages/schema/src/fields.ts
git commit -m "feat(types): export SelectOption type for schema authors"
```

---

### Task 2: Extension Probing in SchemaLoader

**Files:**

- Modify: `packages/schema/src/loader.ts` (add resolveImportPath helper)
- Create: `packages/schema/src/__tests__/loader-extension.test.ts` (test cases)

**Interfaces:**

- Consumes: None
- Produces: `resolveImportPath(filePath: string): string | null` helper function

- [ ] **Step 1: Write test for extension probing**

```typescript
// packages/schema/src/__tests__/loader-extension.test.ts
import { describe, it, expect } from "vitest";
import { resolveImportPath } from "../loader";

describe("resolveImportPath", () => {
  it("resolves exact path", () => {
    // Test with a file that exists
  });

  it("resolves .ts extension", () => {
    // Test extensionless import resolving to .ts
  });

  it("resolves .tsx extension", () => {
    // Test extensionless import resolving to .tsx
  });

  it("resolves /index.ts", () => {
    // Test directory import resolving to index.ts
  });

  it("returns null for non-existent paths", () => {
    expect(resolveImportPath("/nonexistent/file")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/schema && pnpm test -- loader-extension
```

- [ ] **Step 3: Implement resolveImportPath helper**

```typescript
// packages/schema/src/loader.ts
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

export function resolveImportPath(filePath: string): string | null {
  const extensions = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.js"];

  for (const ext of extensions) {
    const fullPath = filePath + ext;
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}
```

- [ ] **Step 4: Update tryLoadFile to use resolveImportPath**

```typescript
// packages/schema/src/loader.ts
async function tryLoadFile(filePath: string): Promise<unknown[]> {
  const resolvedPath = resolveImportPath(filePath);
  if (!resolvedPath) {
    console.error(`  ✗ Could not resolve: ${filePath}`);
    return [];
  }

  try {
    const mod = await import(resolvedPath);
    return Object.values(mod).filter(
      (exp): exp is Record<string, unknown> =>
        typeof exp === "object" && exp !== null && "slug" in exp,
    );
  } catch (err) {
    console.error(`  ✗ Failed to load ${resolvedPath}:`, err);
    return [];
  }
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/schema && pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add packages/schema/src/loader.ts packages/schema/src/__tests__/loader-extension.test.ts
git commit -m "feat(schema): add extension probing for local imports in SchemaLoader"
```

---

### Task 3: Scaffold validation.required Fix

**Files:**

- Modify: `packages/generators/src/scaffold.ts` (fix template)
- Modify: `packages/create-app/templates/` (fix starter template)

**Interfaces:**

- Consumes: None
- Produces: Scaffolded collections use `validation: { required: true }` syntax

- [ ] **Step 1: Find scaffold template location**

```bash
grep -r "required: true" packages/generators/src/
grep -r "required: true" packages/create-app/templates/
```

- [ ] **Step 2: Fix scaffold template**

Replace `required: true` with `validation: { required: true }` in:

- Collection scaffold template
- Global scaffold template
- create-app starter templates

- [ ] **Step 3: Run typecheck**

```bash
cd packages/generators && pnpm typecheck
cd packages/create-app && pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add packages/generators/src/scaffold.ts packages/create-app/templates/
git commit -m "fix(scaffold): use validation.required instead of top-level required"
```

---

### Task 4: Generator Exit-on-Error

**Files:**

- Modify: `packages/schema/src/loader.ts` (return errors array)
- Modify: `packages/cms/src/commands/generate.ts` (check errors, exit non-zero)
- Create: `packages/schema/src/__tests__/loader-errors.test.ts` (test cases)

**Interfaces:**

- Consumes: None
- Produces: `SchemaResult.errors: string[]`, `blaze generate` exits 1 on load failures

- [ ] **Step 1: Write test for error reporting**

```typescript
// packages/schema/src/__tests__/loader-errors.test.ts
import { describe, it, expect } from "vitest";
import { SchemaLoader } from "../loader";

describe("SchemaLoader error reporting", () => {
  it("returns errors when schema files fail to load", async () => {
    // Create a loader pointing to a directory with a broken schema file
    // Verify errors array contains the failure message
  });
});
```

- [ ] **Step 2: Update SchemaResult type**

```typescript
// packages/schema/src/loader.ts
export interface SchemaResult {
  collections: unknown[];
  globals: unknown[];
  components: unknown[];
  errors: string[];
}
```

- [ ] **Step 3: Populate errors array in loadFromDir**

```typescript
// packages/schema/src/loader.ts
async function loadFromDir<T>(dir: string): Promise<{ items: T[]; errors: string[] }> {
  const items: T[] = [];
  const errors: string[] = [];

  // ... existing file listing logic ...

  for (const file of files) {
    const loaded = await tryLoadFile(resolve(dir, file));
    if (loaded.length === 0 && existsSync(resolve(dir, file))) {
      errors.push(`Failed to load ${file}`);
    }
    items.push(...(loaded as T[]));
  }

  return { items, errors };
}
```

- [ ] **Step 4: Update SchemaLoader.load()**

```typescript
// packages/schema/src/loader.ts
async load(): Promise<SchemaResult> {
  const collections = await loadFromDir(this.collectionsDir);
  const globals = await loadFromDir(this.globalsDir);
  const components = await loadFromDir(this.componentsDir);

  return {
    collections: collections.items,
    globals: globals.items,
    components: components.items,
    errors: [...collections.errors, ...globals.errors, ...components.errors],
  };
}
```

- [ ] **Step 5: Update blaze generate to check errors**

```typescript
// packages/cms/src/commands/generate.ts
const result = await loader.load();

if (result.errors.length > 0) {
  console.error("\n✗ Schema loading failed:");
  result.errors.forEach((err) => console.error(`  ${err}`));
  process.exit(1);
}
```

- [ ] **Step 6: Run tests**

```bash
cd packages/schema && pnpm test
cd packages/cms && pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add packages/schema/src/loader.ts packages/cms/src/commands/generate.ts
git commit -m "feat(generators): exit non-zero when schema files fail to load"
```

---

## Phase 2: Features

### Task 5: RichText Toolbar Presets

**Files:**

- Modify: `packages/types/src/fields.ts` (add toolbar to RichTextField)
- Modify: `packages/schema/src/fields.ts` (add toolbar parameter)

**Interfaces:**

- Consumes: None
- Produces: `RichTextField.toolbar?: 'minimal' | 'basic' | 'full'`

- [ ] **Step 1: Add toolbar to RichTextField type**

```typescript
// packages/types/src/fields.ts
export interface RichTextField extends FieldBase {
  type: "richText";
  toolbar?: "minimal" | "basic" | "full";
}
```

- [ ] **Step 2: Update richText builder**

```typescript
// packages/schema/src/fields.ts
export function richText(
  name: string,
  options?: FieldOptions & { toolbar?: "minimal" | "basic" | "full" },
): RichTextField {
  return { name, type: "richText", ...options };
}
```

- [ ] **Step 3: Run typecheck**

```bash
cd packages/types && pnpm typecheck
cd packages/schema && pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/fields.ts packages/schema/src/fields.ts
git commit -m "feat(schema): add toolbar presets to richText field"
```

---

### Task 6: Relation Field Example

**Files:**

- Modify: `src/cms/collections/teachers.ts` (add department field)
- Create: `src/cms/collections/departments.ts` (new collection if needed)

**Interfaces:**

- Consumes: None
- Produces: Working relation field example

- [ ] **Step 1: Check if departments collection exists**

```bash
ls src/cms/collections/departments.ts 2>/dev/null || echo "Need to create"
```

- [ ] **Step 2: Create departments collection (if needed)**

```typescript
// src/cms/collections/departments.ts
import { defineCollection, text, slug } from "@blazing-cms/schema";

export default defineCollection({
  slug: "departments",
  label: "Departments",
  singular: "Department",
  plural: "Departments",
  fields: [slug("name"), text("description")],
});
```

- [ ] **Step 3: Add relation field to teachers**

```typescript
// src/cms/collections/teachers.ts
import { relation } from '@blazing-cms/schema';

// Add to existing fields:
relation('department', { to: 'departments', kind: 'manyToOne' }),
```

- [ ] **Step 4: Run blaze generate**

```bash
blaze generate
```

- [ ] **Step 5: Commit**

```bash
git add src/cms/collections/
git commit -m "feat(schema): add relation field example (teachers -> departments)"
```

---

### Task 7: DynamicZone Usage Pattern

**Files:**

- Create: `src/cms/components/content-blocks/hero.ts`
- Create: `src/cms/components/content-blocks/faq.ts`
- Create: `src/cms/components/content-blocks/cta.ts`
- Modify: `src/cms/collections/pages.ts` (add blocks dynamic zone)

**Interfaces:**

- Consumes: None
- Produces: 3 content-blocks components, pages collection with dynamic zone

- [ ] **Step 1: Create hero component**

```typescript
// src/cms/components/content-blocks/hero.ts
import { defineComponent, text, textarea } from "@blazing-cms/schema";

export default defineComponent({
  slug: "content-blocks/hero",
  label: "Hero",
  fields: [text("headline"), textarea("subtitle"), text("backgroundImage")],
});
```

- [ ] **Step 2: Create FAQ component**

```typescript
// src/cms/components/content-blocks/faq.ts
import { defineComponent, text, textarea } from "@blazing-cms/schema";

export default defineComponent({
  slug: "content-blocks/faq",
  label: "FAQ",
  fields: [text("question"), textarea("answer")],
});
```

- [ ] **Step 3: Create CTA component**

```typescript
// src/cms/components/content-blocks/cta.ts
import { defineComponent, text, url } from "@blazing-cms/schema";

export default defineComponent({
  slug: "content-blocks/cta",
  label: "Call to Action",
  fields: [text("title"), url("link")],
});
```

- [ ] **Step 4: Add dynamic zone to pages**

```typescript
// src/cms/collections/pages.ts
import { dynamicZone } from '@blazing-cms/schema';

// Add to fields:
dynamicZone('blocks', {
  components: ['content-blocks/hero', 'content-blocks/faq', 'content-blocks/cta']
}),
```

- [ ] **Step 5: Run blaze generate**

```bash
blaze generate
```

- [ ] **Step 6: Commit**

```bash
git add src/cms/components/content-blocks/ src/cms/collections/pages.ts
git commit -m "feat(schema): add content-blocks dynamic zone pattern"
```

---

### Task 8: Reusable SEO Component

**Files:**

- Create: `src/cms/components/seo-meta.ts`
- Modify: `src/cms/collections/posts.ts` (embed seo-meta)
- Modify: `src/cms/collections/teachers.ts` (embed seo-meta)
- Modify: `src/cms/collections/pages.ts` (replace inline meta with seo-meta)

**Interfaces:**

- Consumes: None
- Produces: seo-meta component, all indexable collections use it

- [ ] **Step 1: Create seo-meta component**

```typescript
// src/cms/components/seo-meta.ts
import { defineComponent, text, textarea } from "@blazing-cms/schema";

export default defineComponent({
  slug: "seo-meta",
  label: "SEO Meta",
  fields: [
    text("metaTitle", { validation: { maxLength: 60 } }),
    textarea("metaDescription", { validation: { maxLength: 160 } }),
  ],
});
```

- [ ] **Step 2: Embed seo-meta in posts**

```typescript
// src/cms/collections/posts.ts
import { component } from '@blazing-cms/schema';

// Add to fields:
component('seo', { component: 'seo-meta' }),
```

- [ ] **Step 3: Embed seo-meta in teachers**

```typescript
// src/cms/collections/teachers.ts
component('seo', { component: 'seo-meta' }),
```

- [ ] **Step 4: Replace inline meta in pages with seo-meta**

```typescript
// src/cms/collections/pages.ts
// Remove inline metaTitle/metaDescription fields
component('seo', { component: 'seo-meta' }),
```

- [ ] **Step 5: Run blaze generate**

```bash
blaze generate
```

- [ ] **Step 6: Commit**

```bash
git add src/cms/components/seo-meta.ts src/cms/collections/
git commit -m "feat(schema): add reusable seo-meta component"
```

---

### Task 9: Boolean Field for Featured/Pinned

**Files:**

- Modify: `src/cms/collections/posts.ts` (add featured field)
- Modify: `src/cms/collections/teachers.ts` (add featured field)

**Interfaces:**

- Consumes: None
- Produces: `featured` boolean field on posts and teachers

- [ ] **Step 1: Add featured to posts**

```typescript
// src/cms/collections/posts.ts
import { boolean } from '@blazing-cms/schema';

boolean('featured', { defaultValue: false }),
```

- [ ] **Step 2: Add featured to teachers**

```typescript
// src/cms/collections/teachers.ts
boolean('featured', { defaultValue: false }),
```

- [ ] **Step 3: Run blaze generate**

```bash
blaze generate
```

- [ ] **Step 4: Commit**

```bash
git add src/cms/collections/posts.ts src/cms/collections/teachers.ts
git commit -m "feat(schema): add featured boolean field to posts and teachers"
```

---

### Task 10: Datetime Field for Publish Dates

**Files:**

- Modify: `src/cms/collections/posts.ts` (add publishedAt field)
- Modify: `src/cms/collections/teachers.ts` (add publishedAt field)

**Interfaces:**

- Consumes: None
- Produces: `publishedAt` datetime field on posts and teachers

- [ ] **Step 1: Add publishedAt to posts**

```typescript
// src/cms/collections/posts.ts
import { datetime } from '@blazing-cms/schema';

datetime('publishedAt'),
```

- [ ] **Step 2: Add publishedAt to teachers**

```typescript
// src/cms/collections/teachers.ts
datetime('publishedAt'),
```

- [ ] **Step 3: Run blaze generate**

```bash
blaze generate
```

- [ ] **Step 4: Commit**

```bash
git add src/cms/collections/posts.ts src/cms/collections/teachers.ts
git commit -m "feat(schema): add publishedAt datetime field to posts and teachers"
```

---

### Task 11: Array Field for Simple Lists

**Files:**

- Modify: `src/cms/collections/posts.ts` (add tags array field)

**Interfaces:**

- Consumes: None
- Produces: `tags` array field on posts

- [ ] **Step 1: Add tags to posts**

```typescript
// src/cms/collections/posts.ts
import { array, text } from '@blazing-cms/schema';

array('tags', { fields: [text('tag')] }),
```

- [ ] **Step 2: Run blaze generate**

```bash
blaze generate
```

- [ ] **Step 3: Commit**

```bash
git add src/cms/collections/posts.ts
git commit -m "feat(schema): add tags array field to posts"
```

---

### Task 12: Code Field Documentation

**Files:**

- Modify: `AGENTS.md` (add code field section)

**Interfaces:**

- Consumes: None
- Produces: Documented code field builder

- [ ] **Step 1: Find existing field documentation in AGENTS.md**

```bash
grep -n "richText\|textarea\|text(" AGENTS.md | head -20
```

- [ ] **Step 2: Add code field documentation**

```markdown
## Code Field

Use `code()` for embedded code snippets with syntax highlighting.

\`\`\`typescript
code('snippet', { language: 'javascript' })
code('css', { language: 'css' })
code('html', { language: 'html' })
\`\`\`

**Options:**

- `language`: Syntax highlighting language (e.g., 'javascript', 'css', 'html', 'python')
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add code field documentation to AGENTS.md"
```

---

### Task 13: admin.description Documentation

**Files:**

- Modify: `AGENTS.md` (add admin.description section)

**Interfaces:**

- Consumes: None
- Produces: Documented admin.description option

- [ ] **Step 1: Add admin.description documentation**

```markdown
## Admin Description

Every field builder accepts an `admin.description` option for help text shown in the CMS panel.

\`\`\`typescript
text('title', { admin: { description: 'The main heading for this content' } })
textarea('summary', { admin: { description: 'Brief summary shown in listings' } })
\`\`\`
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add admin.description documentation to AGENTS.md"
```

---

### Task 14: Validation Options Documentation

**Files:**

- Modify: `AGENTS.md` (add validation section)

**Interfaces:**

- Consumes: None
- Produces: Documented validation options per field type

- [ ] **Step 1: Add validation options documentation**

```markdown
## Validation Options

All fields accept a `validation` object with these options:

\`\`\`typescript
text('title', {
validation: {
required: true, // Field is required
unique: true, // Must be unique
minLength: 10, // Minimum string length
maxLength: 100, // Maximum string length
pattern: '^[A-Z]', // Regex pattern
message: 'Custom error message',
}
})
\`\`\`

**Per-type options:**

| Field Type     | Available Options                               |
| -------------- | ----------------------------------------------- |
| text, textarea | required, unique, minLength, maxLength, pattern |
| number         | required, unique, min, max                      |
| email, url     | required, unique, pattern                       |
| richText       | required, minLength, maxLength                  |
| boolean        | required                                        |
| select, radio  | required                                        |
| datetime       | required                                        |
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add validation options documentation to AGENTS.md"
```

---

### Task 15: Default Values on Text Fields

**Files:**

- Modify: `AGENTS.md` (add defaultValue section)

**Interfaces:**

- Consumes: None
- Produces: Documented defaultValue option

- [ ] **Step 1: Add defaultValue documentation**

```markdown
## Default Values

All fields accept a `defaultValue` option applied when creating new entries.

\`\`\`typescript
text('title', { defaultValue: 'Untitled' })
number('order', { defaultValue: 0 })
boolean('published', { defaultValue: false })
select('status', { options: [...], defaultValue: 'draft' })
\`\`\`
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add defaultValue documentation to AGENTS.md"
```

---

## Verification

After all tasks:

- [ ] **Run full typecheck:** `pnpm typecheck` across all packages
- [ ] **Run full test suite:** `pnpm test` across all packages
- [ ] **Run fallow audit:** `fallow audit` — no new findings
- [ ] **Test extension probing:** Create test schema with extensionless import, verify it loads
- [ ] **Test error handling:** Create broken schema file, verify `blaze generate` exits 1
- [ ] **Test richText presets:** Verify `richText('x', { toolbar: 'minimal' })` typechecks
- [ ] **Verify generated outputs:** Run `blaze generate`, check schema-registry includes all new fields
