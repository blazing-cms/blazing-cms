# Multi-Format Import/Export Design

## Overview

Extend the existing import-export module to support CSV and XML formats alongside JSON, enabling round-trip import/export for all three formats. CSV is limited to flat top-level fields; XML follows a strict schema matching our document structure.

## Goals

1. Support CSV import/export for collections with flat (scalar-only) fields
2. Support XML import/export with strict schema matching `ImportExportDocument`
3. Auto-detect import format from file extension
4. Provide format selection for export (JSON/CSV/XML)
5. Maintain backward compatibility with existing JSON import/export

## Non-Goals

- Nested field support in CSV (use JSON for complex data)
- Flexible XML mapping or arbitrary XML structures
- Streaming/large-file optimization (current batch approach is sufficient)

---

## Architecture

### Format Handler Interface

```typescript
// packages/cms/src/admin/lib/import-export/formats/types.ts

export interface SerializedOutput {
  content: string | Blob;
  mimeType: string;
  extension: string;
}

export interface FormatHandler {
  name: string;
  extensions: string[];
  mimeType: string;

  parse(file: File): Promise<ImportExportDocument>;
  serialize(doc: ImportExportDocument): SerializedOutput;
}
```

### Format Registry

```typescript
// packages/cms/src/admin/lib/import-export/formats/index.ts

import { jsonHandler } from "./json";
import { csvHandler } from "./csv";
import { xmlHandler } from "./xml";

export const handlers: FormatHandler[] = [jsonHandler, csvHandler, xmlHandler];

export function detectFormat(filename: string): FormatHandler | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return handlers.find((h) => h.extensions.includes(ext)) ?? null;
}

export function getFormatHandler(name: string): FormatHandler | null {
  return handlers.find((h) => h.name === name) ?? null;
}
```

---

## CSV Format

### Import Constraints

- Each row = one entry
- Headers = top-level field names only
- Nested fields (object, group, array, repeater, component, dynamicZone) → **skipped** with warning in import result
- Arrays of scalars → comma-separated in cell: `"tag1,tag2,tag3"`
- Booleans → `"true"` / `"false"`
- Numbers → numeric strings
- Media fields → URL or storage path string
- Empty cells → `undefined`

### CSV Structure

```csv
id,title,slug,content,status
abc,Hello World,hello-world,<p>Content here</p>,published
def,Second Post,second-post,<p>More content</p>,draft
```

### Export Behavior

- Export top-level scalar fields as columns
- `id` column always first
- Arrays → `join(",")`
- Nested objects → **omitted** (UI shows warning before export)
- Globals → separate CSV file per global slug (single-row CSV)

### Parsing Rules

1. Use RFC 4180 compliant parser (handle quoted fields, escaped quotes)
2. First row = headers
3. Map headers to field names
4. Type coercion based on schema field type:
   - `text`, `slug`, `richText`, `status` → string
   - `number` → `parseFloat()`
   - `checkbox` → `value === "true"`
   - `media`, `upload` → string (URL/path)
5. Unknown headers → warn but include in raw data

### Serialization Rules

1. Collect all top-level field names from entries
2. Filter to scalar-only fields (skip nested via schema lookup)
3. Write header row
4. For each entry, write row with proper escaping:
   - Quote fields containing commas, quotes, or newlines
   - Escape internal quotes by doubling: `""`

---

## XML Format

### Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<export formatVersion="1" exportedAt="2026-01-01T00:00:00Z">
  <collections>
    <collection slug="posts">
      <entry id="abc">
        <title>Hello</title>
        <slug>hello-world</slug>
        <content>&lt;p&gt;HTML content&lt;/p&gt;</content>
      </entry>
    </collection>
  </collections>
  <globals>
    <global slug="site">
      <name>My Site</name>
      <tagline>Welcome</tagline>
    </global>
  </globals>
</export>
```

### Rules

- Root element: `<export>` with `formatVersion` and `exportedAt` attributes
- `<collections>` contains `<collection slug="...">` elements
- Each `<collection>` contains `<entry id="...">` elements
- Entry fields are child elements with field name as tag
- Scalar values → text content
- Arrays → repeated child elements: `<tags><tag>a</tag><tag>b</tag></tags>`
- Objects → nested elements: `<meta><title>T</title></meta>`
- `null`/`undefined` → omitted element
- HTML content → escaped (`<` → `&lt;`)
- `<globals>` contains `<global slug="...">` elements
- Same field rules as collections

### Parsing Rules

1. Parse XML with DOMParser (browser) or xml2js (Node)
2. Validate root `<export>` element exists
3. Check `formatVersion` compatibility
4. Iterate `<collection>` elements, extract entries
5. For each `<entry>`, recursively convert child elements to object
6. Handle arrays via repeated tag detection

### Serialization Rules

1. Build XML DOM
2. Set root attributes (`formatVersion`, `exportedAt`)
3. For each collection, create `<collection slug="...">`
4. For each entry, create `<entry id="...">`
5. Convert fields to child elements (escapes HTML automatically)
6. Serialize to string with XML declaration

---

## Updated Pipeline

### Import Flow

```
User selects file
  → detectFormat(filename) → FormatHandler
  → handler.parse(file) → ImportExportDocument
  → existing prepareImport() → PreparedImport
  → provider.importContent()
```

### Export Flow

```
User selects format
  → handler = getFormatHandler(format)
  → existing buildExport() → ImportExportDocument
  → handler.serialize(doc) → SerializedOutput
  → triggerDownload(output)
```

### Files Modified

| File           | Change                                        |
| -------------- | --------------------------------------------- |
| `parse.ts`     | Delegate to format handler based on extension |
| `serialize.ts` | Accept format option, delegate to handler     |
| `types.ts`     | Add `ExportFormat` type                       |

### Files Created

| File                   | Purpose                             |
| ---------------------- | ----------------------------------- |
| `formats/types.ts`     | FormatHandler interface             |
| `formats/json.ts`      | Extract existing JSON logic         |
| `formats/csv.ts`       | CSV parser/serializer               |
| `formats/xml.ts`       | XML parser/serializer               |
| `formats/index.ts`     | Registry + auto-detect              |
| `formats/csv.test.ts`  | CSV tests                           |
| `formats/xml.test.ts`  | XML tests                           |
| `formats/json.test.ts` | Move existing parse/serialize tests |

---

## UI Changes

### Settings Page (`/settings/content`)

**Export card:**

```
[Download icon] Export
[Button: Export all content ▾]
  → JSON (full fidelity)
  → CSV (flat fields only)
  → XML (full fidelity)
```

**Import card:**

- File input accepts `.json`, `.csv`, `.xml`
- Auto-detects format from extension
- Shows detected format badge: `[JSON]` `[CSV]` `[XML]`
- If CSV selected and nested fields exist: show warning before import

**Import summary:**

- Show format badge in summary header
- Show nested field warnings if CSV

### Collection Detail Page (`/collections/$slug`)

**Export button:**

```
[Download icon] Export ▾
  → JSON
  → CSV
```

---

## Test Plan

### Unit Tests

1. **CSV parser:**
   - Parse valid CSV with headers + rows
   - Handle quoted fields with commas
   - Handle escaped quotes (`""`)
   - Skip nested fields with warning
   - Parse arrays from comma-separated values
   - Type coercion (number, boolean)

2. **CSV serializer:**
   - Export entries to CSV with headers
   - Escape fields properly
   - Omit nested fields
   - Handle empty collections

3. **XML parser:**
   - Parse valid XML document
   - Validate formatVersion
   - Extract collections and globals
   - Handle nested elements
   - Handle arrays (repeated tags)
   - Handle HTML escaping

4. **XML serializer:**
   - Export to valid XML structure
   - Escape HTML content
   - Handle nested objects
   - Handle arrays

5. **Format detection:**
   - Detect JSON from `.json`
   - Detect CSV from `.csv`
   - Detect XML from `.xml`
   - Return null for unknown extensions

### Integration Tests

1. CSV round-trip: export → import → compare
2. XML round-trip: export → import → compare
3. JSON round-trip: existing tests still pass

---

## Implementation Order

1. Create format handler interface + registry
2. Extract JSON handler from existing code
3. Implement CSV parser
4. Implement CSV serializer
5. Implement XML parser
6. Implement XML serializer
7. Update parse.ts to use format handler
8. Update serialize.ts to accept format option
9. Update settings page UI
10. Update collection detail page UI
11. Add tests
12. Run lint + typecheck

---

## Risk Assessment

| Risk                       | Mitigation                                          |
| -------------------------- | --------------------------------------------------- |
| CSV nested field confusion | Clear UI warning, documentation                     |
| XML namespace conflicts    | Use simple tag names, no namespaces                 |
| Large CSV/XML files        | Current batch approach handles this                 |
| Format detection ambiguity | Check extension first, fallback to content sniffing |

---

## Success Criteria

1. Import a CSV file → entries created in collections
2. Export to CSV → valid CSV with flat fields
3. Import an XML file → entries + globals created
4. Export to XML → valid XML matching schema
5. All existing JSON tests pass
6. New CSV/XML tests pass
7. Lint + typecheck clean
