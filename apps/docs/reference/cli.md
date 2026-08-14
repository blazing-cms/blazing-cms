# CLI Reference

The `blaze` CLI is available via `@blazing-cms/cms`.

```bash
blaze <command> [options]
```

## Commands

### `blaze dev`

Start the development server.

```bash
blaze dev [--port <port>] [--host <host>] [--emulator]
```

- `--port` — Port number (default: 5173)
- `--host` — Host address (default: localhost)
- `--emulator` — Start Firebase Emulator alongside the dev server

On startup, schemas are loaded from the `cms/` directory, code generation runs, and the admin panel is served via Vite at `http://localhost:5173/`.

### `blaze build`

Build the admin panel for production.

```bash
blaze build
```

### `blaze generate`

Generate types, SDK, validation schemas, Firestore rules, and indexes from your schema files.

```bash
blaze generate [type] [--dir <path>]
```

Where `type` is one of: `types`, `sdk`, `validation`, `registry`, `rules`, `indexes`. If omitted, all outputs are generated.

- `--dir <path>` — Schema directory (default: `cms/`)

Generated outputs include:

- TypeScript types and validation schemas per collection/global
- The schema registry (`schema-registry.ts`)
- Resolved capability config (`app-config.ts`)
- `firestore.rules` and `firestore.indexes.json`

With `VITE_BACKEND_MODE=firebase`, schema definitions are also synced to
Firestore under `_schemas/` for the admin panel to introspect at runtime.

### `blaze deploy`

Deploy the admin panel to Firebase Hosting.

```bash
blaze deploy [--project <project-id>]
```

- `--project` — Firebase project ID (defaults to the current project)

Runs `npx firebase deploy --only hosting`. Requires `firebase.json` (run
`firebase init hosting` first). Deploy Firestore rules and indexes separately
with `firebase deploy --only firestore:rules,firestore:indexes`.

### `blaze scaffold`

Scaffold a new collection, global, or component.

```bash
blaze scaffold <type> [--name <slug>]
```

- `type` — `collection`, `global`, or `component`
- `--name` — Schema slug

### `blaze lint`

Validate schema files for correctness.

```bash
blaze lint [--dir <path>]
```

### `blaze doctor`

Check project health — verifies configuration, dependencies, and schema integrity.

```bash
blaze doctor [--dir <path>]
```

## Environment

The CLI loads `.env` via dotenv. Key variables:

- `VITE_BACKEND_MODE` — `firebase` or `mock` (defaults to `mock` for dev)
- `VITE_FIREBASE_*` — Firebase project credentials

## Schema Sync

TypeScript schema files (`cms/collections/*.ts`, `cms/globals/*.ts`,
`cms/components/*.ts`) are the source of truth. `blaze generate` regenerates
local artifacts (types, validation, SDK, schema registry, Firestore rules and
indexes) and, when `VITE_BACKEND_MODE=firebase`, writes schema definitions to
Firestore under `_schemas/`. The admin panel introspects these at runtime.

The `--sync` flag on `blaze dev` is deprecated: sync now runs automatically when
the dev server runs with `VITE_BACKEND_MODE=firebase`.
