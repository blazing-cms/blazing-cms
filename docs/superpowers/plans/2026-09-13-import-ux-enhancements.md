# Import UX Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add selective import with checkbox UI, summary preview, and single global export.

**Architecture:** Parse file → build preview → user selects items → filter document → import only selected. Add `ImportPreview` type, `buildImportPreview` function, `filterDocument` function, and preview UI component.

**Tech Stack:** TypeScript, Vitest, React, Tanstack Query

**Spec:** `docs/superpowers/specs/2026-09-13-import-ux-enhancements-design.md`

## Global Constraints

- TypeScript strict mode
- No external dependencies for UI components (use existing patterns)
- Vitest for testing
- Follow existing code patterns in `packages/cms/src/admin/lib/import-export/`
- All tests must pass before commit

---

## File Structure

### New Files

| File              | Responsibility                    |
| ----------------- | --------------------------------- |
| `preview.ts`      | Build ImportPreview from document |
| `preview.test.ts` | Tests for preview builder         |

### Modified Files

| File                                   | Change                                     |
| -------------------------------------- | ------------------------------------------ |
| `types.ts`                             | Add ImportPreviewItem, ImportPreview types |
| `import.ts`                            | Add filterDocument function                |
| `index.ts`                             | Export new utilities                       |
| `../../../routes/settings/content.tsx` | Add preview step, global export card       |

---

## Tasks

### Task 1: Add Preview Types

**Files:**

- Modify: `packages/cms/src/admin/lib/import-export/types.ts`

**Interfaces:**

- Produces: `ImportPreviewItem`, `ImportPreview` types

- [ ] **Step 1: Add types to types.ts**

```typescript
// packages/cms/src/admin/lib/import-export/types.ts

// ... keep existing types ...

export interface ImportPreviewItem {
  slug: string;
  count: number;
  selected: boolean;
}

export interface ImportPreview {
  collections: ImportPreviewItem[];
  globals: ImportPreviewItem[];
  format: string;
  totalEntries: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/types.ts
git commit -m "feat(import-export): add ImportPreview types"
```

---

### Task 2: Create Preview Builder

**Files:**

- Create: `packages/cms/src/admin/lib/import-export/preview.ts`
- Create: `packages/cms/src/admin/lib/import-export/preview.test.ts`

**Interfaces:**

- Consumes: `ImportExportDocument`, `ImportPreview` from `./types`
- Produces: `buildImportPreview` function

- [ ] **Step 1: Write preview.ts**

```typescript
// packages/cms/src/admin/lib/import-export/preview.ts

import type { ImportExportDocument, ImportPreview } from "./types";

/**
 * Build a preview of the import document for user selection.
 */
export function buildImportPreview(doc: ImportExportDocument, formatName: string): ImportPreview {
  const collections = Object.entries(doc.collections).map(([slug, entries]) => ({
    slug,
    count: entries.length,
    selected: true,
  }));

  const globals = Object.keys(doc.globals).map((slug) => ({
    slug,
    count: 0,
    selected: true,
  }));

  const totalEntries = collections.reduce((sum, c) => sum + c.count, 0);

  return {
    collections,
    format: formatName,
    globals,
    totalEntries,
  };
}
```

- [ ] **Step 2: Write preview.test.ts**

```typescript
// packages/cms/src/admin/lib/import-export/preview.test.ts

import { describe, expect, it } from "vitest";

import { FORMAT_VERSION, type ImportExportDocument } from "./types";
import { buildImportPreview } from "./preview";

describe("buildImportPreview", () => {
  it("builds preview from document with collections and globals", () => {
    const doc: ImportExportDocument = {
      collections: {
        posts: [{ id: "1", title: "Hello" }],
        pages: [
          { id: "2", title: "About" },
          { id: "3", title: "Contact" },
        ],
      },
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: { site: { name: "My Site" } },
    };

    const preview = buildImportPreview(doc, "json");

    expect(preview.format).toBe("json");
    expect(preview.collections).toHaveLength(2);
    expect(preview.collections[0]).toEqual({ slug: "posts", count: 1, selected: true });
    expect(preview.collections[1]).toEqual({ slug: "pages", count: 2, selected: true });
    expect(preview.globals).toHaveLength(1);
    expect(preview.globals[0]).toEqual({ slug: "site", count: 0, selected: true });
    expect(preview.totalEntries).toBe(3);
  });

  it("handles empty document", () => {
    const doc: ImportExportDocument = {
      collections: {},
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: {},
    };

    const preview = buildImportPreview(doc, "csv");

    expect(preview.format).toBe("csv");
    expect(preview.collections).toHaveLength(0);
    expect(preview.globals).toHaveLength(0);
    expect(preview.totalEntries).toBe(0);
  });

  it("counts entries correctly", () => {
    const doc: ImportExportDocument = {
      collections: {
        posts: [
          { id: "1", title: "A" },
          { id: "2", title: "B" },
          { id: "3", title: "C" },
        ],
      },
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: {},
    };

    const preview = buildImportPreview(doc, "xml");
    expect(preview.totalEntries).toBe(3);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/preview.test.ts
```

Expected: PASS

- [ ] **Step 4: Update index.ts to export preview**

```typescript
// packages/cms/src/admin/lib/import-export/index.ts

export * from "./types";
export * from "./normalize";
export * from "./parse";
export * from "./validate";
export * from "./serialize";
export * from "./import";
export * from "./batch";
export * from "./formats";
export * from "./preview";
```

- [ ] **Step 5: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/preview.ts packages/cms/src/admin/lib/import-export/preview.test.ts packages/cms/src/admin/lib/import-export/index.ts
git commit -m "feat(import-export): add preview builder with tests"
```

---

### Task 3: Add Filter Document Function

**Files:**

- Modify: `packages/cms/src/admin/lib/import-export/import.ts`
- Create: `packages/cms/src/admin/lib/import-export/filter.test.ts`

**Interfaces:**

- Consumes: `ImportExportDocument`, `ImportPreview` from `./types`
- Produces: `filterDocument` function

- [ ] **Step 1: Write filter.test.ts**

```typescript
// packages/cms/src/admin/lib/import-export/filter.test.ts

import { describe, expect, it } from "vitest";

import { FORMAT_VERSION, type ImportExportDocument, type ImportPreview } from "./types";
import { filterDocument } from "./import";

describe("filterDocument", () => {
  it("filters to only selected collections", () => {
    const doc: ImportExportDocument = {
      collections: {
        posts: [{ id: "1", title: "Hello" }],
        pages: [{ id: "2", title: "About" }],
      },
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: {},
    };

    const preview: ImportPreview = {
      collections: [
        { slug: "posts", count: 1, selected: true },
        { slug: "pages", count: 1, selected: false },
      ],
      format: "json",
      globals: [],
      totalEntries: 2,
    };

    const filtered = filterDocument(doc, preview);

    expect(Object.keys(filtered.collections)).toEqual(["posts"]);
    expect(filtered.collections.posts).toHaveLength(1);
  });

  it("filters to only selected globals", () => {
    const doc: ImportExportDocument = {
      collections: {},
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: { site: { name: "My Site" }, nav: { items: [] } },
    };

    const preview: ImportPreview = {
      collections: [],
      format: "json",
      globals: [
        { slug: "site", count: 0, selected: true },
        { slug: "nav", count: 0, selected: false },
      ],
      totalEntries: 0,
    };

    const filtered = filterDocument(doc, preview);

    expect(Object.keys(filtered.globals)).toEqual(["site"]);
    expect(filtered.globals.site).toEqual({ name: "My Site" });
  });

  it("returns empty document when all deselected", () => {
    const doc: ImportExportDocument = {
      collections: { posts: [{ id: "1", title: "Hello" }] },
      exportedAt: "2026-01-01T00:00:00Z",
      formatVersion: FORMAT_VERSION,
      globals: { site: { name: "My Site" } },
    };

    const preview: ImportPreview = {
      collections: [{ slug: "posts", count: 1, selected: false }],
      format: "json",
      globals: [{ slug: "site", count: 0, selected: false }],
      totalEntries: 1,
    };

    const filtered = filterDocument(doc, preview);

    expect(Object.keys(filtered.collections)).toHaveLength(0);
    expect(Object.keys(filtered.globals)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Add filterDocument to import.ts**

```typescript
// packages/cms/src/admin/lib/import-export/import.ts

// ... keep existing code ...

/**
 * Filter a document to only include selected collections and globals.
 */
export function filterDocument(
  doc: ImportExportDocument,
  preview: {
    collections: Array<{ slug: string; selected: boolean }>;
    globals: Array<{ slug: string; selected: boolean }>;
  },
): ImportExportDocument {
  const selectedCollectionSlugs = new Set(
    preview.collections.filter((c) => c.selected).map((c) => c.slug),
  );
  const selectedGlobalSlugs = new Set(preview.globals.filter((g) => g.selected).map((g) => g.slug));

  const collections: ImportExportDocument["collections"] = {};
  for (const [slug, entries] of Object.entries(doc.collections)) {
    if (selectedCollectionSlugs.has(slug)) {
      collections[slug] = entries;
    }
  }

  const globals: ImportExportDocument["globals"] = {};
  for (const [slug, data] of Object.entries(doc.globals)) {
    if (selectedGlobalSlugs.has(slug)) {
      globals[slug] = data;
    }
  }

  return {
    collections,
    exportedAt: doc.exportedAt,
    formatVersion: doc.formatVersion,
    globals,
  };
}
```

- [ ] **Step 3: Run filter tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/filter.test.ts
```

Expected: PASS

- [ ] **Step 4: Update index.ts to export filterDocument**

```typescript
// Already exported via export * from "./import" in index.ts
```

- [ ] **Step 5: Commit**

```bash
git add packages/cms/src/admin/lib/import-export/import.ts packages/cms/src/admin/lib/import-export/filter.test.ts
git commit -m "feat(import-export): add filterDocument function with tests"
```

---

### Task 4: Update Settings Page with Preview UI

**Files:**

- Modify: `packages/cms/src/admin/routes/settings/content.tsx`

**Interfaces:**

- Consumes: `buildImportPreview`, `filterDocument`, `ImportPreview`
- Produces: Updated import flow with preview step

- [ ] **Step 1: Update content.tsx**

Replace the import handling logic to include preview step. The key changes:

1. Add `preview` state
2. After parsing file, show preview instead of importing immediately
3. Add checkbox toggle handlers
4. On confirm, filter document and import

```typescript
// packages/cms/src/admin/routes/settings/content.tsx

import { useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { Download, Upload, FileJson, ChevronDown, Globe, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { collections, components, globals } from "@/__generated__/schema-registry";
import { useToast } from "@/components/toast-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  buildExport,
  buildFieldSources,
  buildImportPreview,
  detectFormat,
  downloadDocument,
  filterDocument,
  importDocument,
  parseImportFile,
  type ExportFormat,
  type ImportPreview,
  type ImportProgress,
  type ImportResult,
} from "@/lib/import-export";
import { useDataProvider } from "@/lib/providers/context";
import { appLayoutRoute } from "@/routes/app-layout";

export const contentToolsRoute = createRoute({
  component: ContentTools,
  getParentRoute: () => appLayoutRoute,
  path: "/settings/content",
});

function ContentTools() {
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fields = buildFieldSources({ collections, components, globals });
  const globalSlugs = Object.keys(fields.globals);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ImportExportDocument | null>(null);

  async function handleExport(format: ExportFormat = "json") {
    setExporting(true);
    try {
      const doc = await buildExport(provider, fields);
      const filename = `content-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadDocument(doc, filename, format);
      addToast({ description: `Content exported as ${format.toUpperCase()}.`, title: "Exported" });
    } catch (err) {
      addToast({ description: String(err), title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function handleExportGlobal(slug: string, format: ExportFormat = "json") {
    setExporting(true);
    try {
      const doc = await buildExport(provider, fields, { collections: [], globals: [slug] });
      const filename = `global-${slug}-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadDocument(doc, filename, format);
      addToast({ description: `Exported global "${slug}".`, title: "Exported" });
    } catch (err) {
      addToast({ description: String(err), title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const doc = await parseImportFile(file);
      const format = detectFormat(file.name);
      const preview = buildImportPreview(doc, format?.name ?? "unknown");
      setParsedDoc(doc);
      setPreview(preview);
    } catch (err) {
      setError(String(err));
      addToast({ description: String(err), title: "Import failed", variant: "destructive" });
    }
  }

  function toggleCollection(slug: string, selected: boolean) {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        collections: prev.collections.map((c) =>
          c.slug === slug ? { ...c, selected } : c,
        ),
      };
    });
  }

  function toggleGlobal(slug: string, selected: boolean) {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        globals: prev.globals.map((g) =>
          g.slug === slug ? { ...g, selected } : g,
        ),
      };
    });
  }

  function selectAll() {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        collections: prev.collections.map((c) => ({ ...c, selected: true })),
        globals: prev.globals.map((g) => ({ ...g, selected: true })),
      };
    });
  }

  function deselectAll() {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        collections: prev.collections.map((c) => ({ ...c, selected: false })),
        globals: prev.globals.map((g) => ({ ...g, selected: false })),
      };
    });
  }

  async function confirmImport() {
    if (!parsedDoc || !preview) return;

    const selectedCount = preview.collections
      .filter((c) => c.selected)
      .reduce((s, c) => s + c.count, 0) +
      preview.globals.filter((g) => g.selected).length;

    if (selectedCount === 0) {
      addToast({ description: "No items selected.", title: "Import cancelled", variant: "destructive" });
      return;
    }

    setImporting(true);
    setProgress(null);
    setResult(null);
    setError(null);

    try {
      const filtered = filterDocument(parsedDoc, preview);
      const res = await importDocument(provider, filtered, fields, (p) => setProgress(p));
      setResult(res);

      for (const slug of Object.keys(filtered.collections)) {
        await queryClient.invalidateQueries({ queryKey: ["collection", slug] });
      }
      for (const slug of Object.keys(filtered.globals)) {
        await queryClient.invalidateQueries({ queryKey: ["global", slug] });
      }
      await queryClient.invalidateQueries({ queryKey: ["media"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });

      addToast({
        description: `Imported ${res.imported} item(s), skipped ${res.skipped}.`,
        title: "Import complete",
      });

      setPreview(null);
      setParsedDoc(null);
    } catch (err) {
      setError(String(err));
      addToast({ description: String(err), title: "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  function cancelImport() {
    setPreview(null);
    setParsedDoc(null);
  }

  const percent =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Export all content for backup or migrate it into another Blazing CMS project.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" /> Export
            </CardTitle>
            <CardDescription>
              Downloads a file containing every collection entry and global.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={exporting}>
                  <Download className="mr-1 h-4 w-4" />
                  {exporting ? "Exporting..." : "Export all content"}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => void handleExport("json")}>
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON (full fidelity)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport("csv")}>
                  CSV (flat fields only)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport("xml")}>
                  XML (full fidelity)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Import
            </CardTitle>
            <CardDescription>
              Restore from an exported file. Select which items to import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.xml,application/json,text/csv,application/xml"
              className="hidden"
              onChange={(e) => void handleImportFile(e)}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || !!preview}
            >
              <FileJson className="mr-1 h-4 w-4" />
              {importing ? "Importing..." : "Choose file to import"}
            </Button>
          </CardContent>
        </Card>

        {globalSlugs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Export Globals
              </CardTitle>
              <CardDescription>Export individual global settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={exporting}>
                    <Globe className="mr-1 h-4 w-4" />
                    Choose global
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {globalSlugs.map((slug) => (
                    <DropdownMenuItem key={slug} onClick={() => void handleExportGlobal(slug)}>
                      {slug}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        )}
      </div>

      {preview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Import Preview
              <Badge variant="secondary">{preview.format.toUpperCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.collections.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Collections</p>
                {preview.collections.map((col) => (
                  <label key={col.slug} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={col.selected}
                      onCheckedChange={(checked) => toggleCollection(col.slug, !!checked)}
                    />
                    <span className="text-sm">{col.slug}</span>
                    <span className="text-xs text-muted-foreground">
                      ({col.count} {col.count === 1 ? "entry" : "entries"})
                    </span>
                  </label>
                ))}
              </div>
            )}

            {preview.globals.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Globals</p>
                {preview.globals.map((g) => (
                  <label key={g.slug} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={g.selected}
                      onCheckedChange={(checked) => toggleGlobal(g.slug, !!checked)}
                    />
                    <span className="text-sm">{g.slug}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-medium text-foreground">{preview.totalEntries}</span>{" "}
                {preview.totalEntries === 1 ? "entry" : "entries"} to import
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelImport}>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={() => void confirmImport()} disabled={importing}>
                Import Selected
              </Button>
            </div>

            <div className="flex gap-2 text-xs">
              <Button variant="ghost" size="sm" onClick={selectAll}>Select all</Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>Deselect all</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {importing && progress && (
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            <span>Importing...</span>
            <span>
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Import failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Import summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Imported <span className="font-medium text-foreground">{result.imported}</span>{" "}
              item(s) and skipped{" "}
              <span className="font-medium text-foreground">{result.skipped}</span> (already exist
              or failed validation).
            </p>
            {result.errors.length > 0 && (
              <div className="max-h-60 overflow-auto rounded-md border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {result.errors.length} skipped item(s)
                </p>
                <ul className="space-y-1 text-xs">
                  {result.errors.slice(0, 50).map((err, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="shrink-0 font-mono text-muted-foreground">
                        {err.collection}/{err.id}
                      </span>
                      <span>{err.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd packages/cms && npm run typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/cms/src/admin/routes/settings/content.tsx
git commit -m "feat(import-export): add preview UI with selective import and global export"
```

---

### Task 5: Run All Tests

**Files:**

- None (verification only)

- [ ] **Step 1: Run all import-export tests**

```bash
cd packages/cms && npx vitest run src/admin/lib/import-export/
```

Expected: All tests PASS

- [ ] **Step 2: Run full test suite**

```bash
cd packages/cms && npm test
```

Expected: All tests PASS

- [ ] **Step 3: Run typecheck**

```bash
cd packages/cms && npm run typecheck
```

Expected: PASS

- [ ] **Step 4: Run lint**

```bash
cd packages/cms && npm run lint
```

Expected: PASS

---

### Task 6: Final Commit

- [ ] **Step 1: Check git status**

```bash
git status
```

- [ ] **Step 2: Stage all changes**

```bash
git add -A
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(import-export): complete import UX enhancements with preview and selective import"
```

---

## Spec Coverage Check

| Spec Requirement            | Task   |
| --------------------------- | ------ |
| ImportPreviewItem type      | Task 1 |
| ImportPreview type          | Task 1 |
| buildImportPreview function | Task 2 |
| filterDocument function     | Task 3 |
| Preview UI with checkboxes  | Task 4 |
| Select/Deselect all buttons | Task 4 |
| Global export card          | Task 4 |
| All tests pass              | Task 5 |

All spec requirements covered.
