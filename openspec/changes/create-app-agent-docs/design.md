# Create-App AI Agent Docs — Design

## Context

See proposal.md — Why. The `@blazing-cms/create-app` package is a single-file
scaffolder (`src/index.ts`) plus a thin `bin/` wrapper, tested with vitest
against mocked `node:fs` and `node:readline`. It is documentation-only change;
no runtime behavior changes.

## Goals / Non-Goals

**Goals:**

- Produce a `packages/create-app/AGENTS.md` that gives an AI agent everything it
  needs to safely edit, test, and extend the scaffold without reading every
  source file.
- Accurately document the current state of the package, including known
  template drift from the `@blazing-cms/schema` DSL.

**Non-Goals:**

- Fixing the outdated example templates in `scaffold()` — flagged in the docs
  instead so agents know not to treat them as authoritative.
- Adding root-level or other packages' `AGENTS.md` files.
- Any change to package source, tests, or build.

## Decisions

- **Placement**: `packages/create-app/AGENTS.md`, following the convention of
  agent-oriented docs living beside the package they describe. Alternative:
  a section in the docs site — rejected because agent docs must live in the
  repo tree the agent actually explores.
- **Scope of content**: document (1) identity + invocation, (2) source layout,
  (3) how `scaffold()` writes templates and the `createFile`/`makePrompt`
  helpers, (4) dev workflow commands, (5) test conventions, (6) gotchas —
  specifically that example `posts.ts` / `site-settings.ts` templates use
  outdated DSL (`required`, `sourceField`, `status()`, `image()`) versus the
  current `validation`, `source`, `media`/`upload` builders, and that templates
  are emitted with `content.trimStart()`.
- **Accuracy over brevity**: verified against `src/index.ts`, `bin/`, the two
  test files, and `@blazing-cms/schema` builders before writing. No invented
  claims about the package.

## Risks / Trade-offs

- [Docs go stale as the package evolves] → keep the file small and focused on
  facts that change slowly; the gotchas section is the most likely to drift,
  so it names the exact source locations to re-check.
- [Agent acts on the flagged drift and "fixes" templates unprompted] → the
  docs state explicitly that the drift is known and out of scope for this
  change; template changes belong to a schema-DSL-sync change.
