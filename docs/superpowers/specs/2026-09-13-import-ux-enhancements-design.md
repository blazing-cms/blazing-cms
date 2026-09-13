# Import UX Enhancements Design

## Overview

Enhance the import workflow with selective import (checkbox UI), summary preview, and single global export. Conflict resolution remains skip-only (current behavior).

## Goals

1. Allow users to select which collections/globals to import before committing
2. Show a summary preview with entry counts before import
3. Add UI to export individual globals
4. Maintain backward compatibility with existing import flow

## Non-Goals

- Per-entry conflict resolution (skip-only remains)
- Per-entry diff view (summary counts only)
- Merge/overwrite strategies

---

## 1. Selective Import

### Flow

1. User selects file (JSON/CSV/XML)
2. File is parsed into `ImportExportDocument`
3. Preview step shows collections/globals with checkboxes
4. User adjusts selections
5. Click "Import Selected" → only selected items are imported

### New Types

```typescript
// packages/cms/src/admin/lib/import-export/types.ts

export interface ImportPreviewItem {
  slug: string;
  count: number; // 0 for globals
  selected: boolean;
}

export interface ImportPreview {
  collections: ImportPreviewItem[];
  globals: ImportPreviewItem[];
  format: string;
  totalEntries: number;
}
```

### Preview Builder

```typescript
// packages/cms/src/admin/lib/import-export/preview.ts

import type { ImportExportDocument, ImportPreview } from "./types";

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

### Filtered Import

```typescript
// packages/cms/src/admin/lib/import-export/import.ts

export function filterDocument(
  doc: ImportExportDocument,
  preview: ImportPreview,
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

---

## 2. Summary Preview UI

### Preview Card

```tsx
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
        Cancel
      </Button>
      <Button onClick={confirmImport} disabled={selectedCount === 0}>
        Import Selected
      </Button>
    </div>
  </CardContent>
</Card>
```

### State Management

```typescript
const [preview, setPreview] = useState<ImportPreview | null>(null);

function toggleCollection(slug: string, selected: boolean) {
  setPreview((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      collections: prev.collections.map((c) => (c.slug === slug ? { ...c, selected } : c)),
    };
  });
}

function toggleGlobal(slug: string, selected: boolean) {
  setPreview((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      globals: prev.globals.map((g) => (g.slug === slug ? { ...g, selected } : g)),
    };
  });
}

const selectedCount = preview
  ? preview.collections.filter((c) => c.selected).reduce((s, c) => s + c.count, 0) +
    preview.globals.filter((g) => g.selected).length
  : 0;
```

---

## 3. Single Global Export

### Settings Page

Add a third card or section for global export:

```tsx
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
```

### Export Handler

```typescript
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
```

---

## Updated Import Flow

```
User selects file
  → detectFormat(file.name) → FormatHandler
  → handler.parse(file) → ImportExportDocument
  → buildImportPreview(doc, handler.name) → ImportPreview
  → Show preview UI with checkboxes
  → User clicks "Import Selected"
  → filterDocument(doc, preview) → filtered doc
  → importDocument(provider, filteredDoc, fields, onProgress)
  → Show result
```

---

## Files

### New Files

| File              | Purpose                           |
| ----------------- | --------------------------------- |
| `preview.ts`      | Build ImportPreview from document |
| `preview.test.ts` | Tests for preview builder         |

### Modified Files

| File          | Change                                     |
| ------------- | ------------------------------------------ |
| `types.ts`    | Add ImportPreviewItem, ImportPreview types |
| `import.ts`   | Add filterDocument function                |
| `index.ts`    | Export new utilities                       |
| `content.tsx` | Add preview step, global export card       |

---

## Test Plan

### Unit Tests

1. **preview.ts:**
   - Build preview from document with collections and globals
   - Handle empty document
   - Correctly count entries

2. **import.ts (filterDocument):**
   - Filter to only selected collections
   - Filter to only selected globals
   - Handle all deselected (empty import)

### Integration Tests

1. Import flow with preview step
2. Selective import only imports selected items
3. Single global export downloads correct file

---

## Implementation Order

1. Add types (ImportPreviewItem, ImportPreview)
2. Create preview.ts + tests
3. Add filterDocument to import.ts + tests
4. Update content.tsx with preview UI
5. Add global export card to settings
6. Run all tests
7. Commit

---

## Success Criteria

1. Select file → see preview with checkboxes
2. Uncheck collections → those are not imported
3. Uncheck globals → those are not imported
4. Click "Import Selected" → only selected items imported
5. Export single global → downloads JSON with that global only
6. All existing tests pass
7. New tests pass
