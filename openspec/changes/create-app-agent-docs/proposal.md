# Create-App Agent Docs

## Why

`@blazing-cms/create-app` scaffolds new projects, but the generated projects ship
with no guidance for AI coding agents: nothing documents the project layout,
how the schema files drive the admin panel, or which commands to run. Agents
working in a generated app have to reverse-engineer the CMS from scratch. The
scaffolder should emit an `AGENTS.md` into every new project.

## What Changes

- Add an `AGENTS.md` template that `@blazing-cms/create-app` writes into every
  generated project. The template lives at `packages/create-app/AGENTS.md` and
  is the single source of truth for its content.
- The generated `AGENTS.md` documents, for the generated app:
  - Project layout (`blazing-cms.config.ts`, `cms/collections`,
    `cms/globals`, `.env`, `.gitignore`)
  - That TypeScript schema files are the source of truth and drive
    generation (types, SDK, validation, Firestore rules, indexes)
  - Dev workflow commands (`pnpm dev`, `build`, `generate`, `deploy`,
    `scaffold`)
  - Firebase configuration via `VITE_FIREBASE_*` env vars and
    `VITE_BACKEND_MODE` (`firebase` | `mock`)
  - Next steps and pointers to the docs site
- Update `scaffold()` to read and write the `AGENTS.md` template, and update
  its tests to cover it.
- No behavior changes to the CMS itself.

## Capabilities

### New Capabilities

None — this change adds a scaffold output file only.

### Modified Capabilities

None — no spec-level behavior changes. This change opts out of specs via
`skip_specs: true` (pure documentation/tooling).

## Impact

- Modified: `packages/create-app/src/index.ts` (write AGENTS.md into the new
  project), `packages/create-app/src/__tests__/` (coverage for the new file)
- New/changed: `packages/create-app/AGENTS.md` (the generated-app docs
  template)
- Generated apps created after this change will include `AGENTS.md`
