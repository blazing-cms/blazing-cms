## Context

See `proposal.md` for motivation. Current scaffold writes most file content as
inline template literals in `packages/create-app/src/index.ts` and reads
`AGENTS.md` via `new URL("../AGENTS.md", import.meta.url)`. Two problems drive
the design:

1. `blaze deploy` (packages/cms/src/commands/deploy.ts) hard-fails without a
   `firebase.json`; today the user must run `firebase init hosting` manually.
2. `packages/create-app/package.json` ships only `dist` and `bin` in `files`,
   so `AGENTS.md` is **absent from the published tarball** — the runtime read
   would fail for npm consumers.

`firestore.rules` and `firestore.indexes.json` are produced/overwritten by
`blaze generate` (packages/cms/src/commands/generate.ts), so scaffolded
versions are valid starters, not the source of truth.

## Goals / Non-Goals

**Goals:**

- Generated projects contain `firebase.json`, `.firebaserc`, `firestore.rules`,
  and `firestore.indexes.json` so deploy and emulator workflows work without
  `firebase init`.
- Template files ship in the published package (fixing the `AGENTS.md` gap).
- Keep scaffold templates as real files (valid JSON / rules syntax), not
  string literals, so they can be validated and edited directly.

**Non-Goals:**

- Changing `blaze build` output location or the CMS package's generate/deploy
  commands.
- Scaffolding `storage.rules` (not generated today; not requested).
- Migrating existing inline templates (package.json, tsconfig, collection
  files) into `templates/`.

## Decisions

### D1: Ship file templates from `packages/create-app/templates/`

Add a `templates/` directory at the package root containing `firebase.json`,
`.firebaserc`, `firestore.rules`, `firestore.indexes.json`, and `AGENTS.md`.
`index.ts` reads them at runtime with a small helper:

```ts
function readTemplate(name: string): string {
  return readFileSync(new URL(`../templates/${name}`, import.meta.url), "utf-8");
}
```

`AGENTS.md` moves from the package root into `templates/AGENTS.md` (updated
reference). `package.json` `files` becomes `["dist", "bin", "templates"]`.

Rationale vs. inline literals: JSON and rules files must be byte-valid; shipping
them as files lets tooling validate them and keeps `index.ts` free of large
escaped blocks. One mechanism for all external templates.

### D2: `firebase.json` targets the admin SPA output and emulator defaults

```json
{
  "hosting": {
    "public": "node_modules/@blazing-cms/cms/dist/admin",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true }
  }
}
```

`hosting.public` points at the actual `blaze build` output for a published
install (`<cms-package>/dist/admin`, per `build.ts`'s `outDir`). This matches
the existing deployment docs, which instruct users to point hosting at the
build output the CLI prints. Emulator ports match the defaults used by
`blaze dev --emulator`. The SPA rewrite avoids 404s on client-side routes.

Alternative considered: pointing `public` at the project's own `dist/` — but
nothing writes there today, so that would break deploys.

### D3: `.firebaserc` uses the `.env` placeholder

```json
{ "projects": { "default": "your-project-id" } }
```

The project id is unknowable at scaffold time and lives in
`.env` (`VITE_FIREBASE_PROJECT_ID=your-project-id`). Keeping the same
placeholder in both files means the user replaces it once, in `.env`, then
updates `.firebaserc` to match their real project id.

### D4: `firestore.rules` is a safe deny-all starter

Ship the RBAC helper skeleton (matching generate.ts's `RBAC_HELPER_RULES`)
plus the deny-all catch-all that `generate` also emits, so the file is valid
and secure immediately. `blaze dev`/`blaze generate` overwrite it from the
schema before the emulator or any real access happens, so the starter is only
consulted by tooling that validates the file.

Alternative considered: duplicating the per-collection content rules the
generator would emit — that would duplicate generator logic and drift.

### D5: `firestore.indexes.json` matches generator output

`{ "indexes": [] }` — identical to what `generateFirestoreIndexes` writes
today, so the scaffolded file is never a diff against a freshly generated one.

## Risks / Trade-offs

- **`hosting.public` is a `node_modules` path** → Unusual but is the real
  build output for published installs; `AGENTS.md` documents it and that the
  CLI prints the actual path so users can adjust.
- **Starter rules deny everything** → Only relevant before first `blaze dev`;
  documented in `AGENTS.md` as regenerated. A locked-down default is safer than
  an open one.
- **`AGENTS.md` relocation** → Any other consumers referencing the package-root
  file break. Only `index.ts` references it; checked via `rg`.
- **Placeholder project id confusion** → `.firebaserc` and `.env` share the
  same placeholder, and `AGENTS.md` next-steps calls out replacing both.

## Migration Plan

No migration for existing projects (they are unaffected). Rollback is a revert
of the change. Publish a new `@blazing-cms/create-app` after merge; verify with
`pnpm pack --dry-run` that `templates/` is in the tarball.
