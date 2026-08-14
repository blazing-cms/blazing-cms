# Create-App AI Agent Docs

## Why

The `@blazing-cms/create-app` package is the entry point for every new project,
but nothing in the repository documents how it works: its scaffold output, its
templating conventions, its testing setup, or the fact that its example schema
templates have drifted from the current `@blazing-cms/schema` DSL. AI coding
agents working in this package have to reverse-engineer all of it from source
and can easily introduce changes that break the scaffold or regenerate
outdated examples.

## What Changes

- Add `packages/create-app/AGENTS.md` documenting the package for AI coding
  agents, covering:
  - Purpose, package identity, and how the CLI is invoked
  - Source layout (`src/index.ts`, `src/__tests__/`, `bin/`)
  - How `scaffold()` works: the template files it writes and the `createFile`
    / `makePrompt` helpers
  - Development workflow: build, test, typecheck, lint commands
  - Testing conventions: vitest with mocked `node:fs` / `node:readline`
  - Gotchas: the example collection/global templates currently use an outdated
    schema DSL (`required`, `sourceField`, `status()`, `image()`) that no longer
    matches `@blazing-cms/schema` builders, and how to keep templates in sync
- No runtime behavior changes to the package.

## Capabilities

### New Capabilities

None — this change adds documentation only.

### Modified Capabilities

None — no spec-level behavior changes. This change opts out of specs via
`skip_specs: true` (pure documentation/tooling).

## Impact

- New file: `packages/create-app/AGENTS.md`
- No changes to source, tests, build, or runtime behavior of
  `@blazing-cms/create-app` or any other package
