# Create-App Agent Docs — Design

## Context

See proposal.md — Why. The `@blazing-cms/create-app` scaffold writes every
project file through the `createFile(dir, name, content)` helper using inline
template-literal strings. The deliverable is a new `AGENTS.md` file emitted into
every generated project, authored at `packages/create-app/AGENTS.md`.

## Goals / Non-Goals

**Goals:**

- Every scaffolded project contains an `AGENTS.md` that orients an AI coding
  agent to the generated app (layout, schema-as-source-of-truth, commands,
  Firebase env config).
- A single authored source for the template content so docs and scaffold
  output can't drift apart.

**Non-Goals:**

- Root-level or per-package agent docs for the monorepo itself.
- Fixing the outdated example schema templates in `scaffold()` — separate
  schema-DSL-sync change.
- Any change to the CMS packages or the docs site.

## Decisions

- **Single source of truth**: `packages/create-app/AGENTS.md` holds the
  template content. `scaffold()` reads it at runtime via
  `new URL("../AGENTS.md", import.meta.url)` (works from both `src/` under
  vitest and `dist/` when installed, since the published tarball includes the
  file at the package root) and writes it into the project with the existing
  `createFile` helper. Alternative: inlining the content as a template literal
  like the other templates — rejected because the docs would then be
  duplicated in two places.
- **Template path in the project**: written to the project root as
  `AGENTS.md`, matching the `package.json`/`tsconfig.json`/`.env` pattern of
  root-level project files.
- **Content scope**: describes the generated app only — layout, schema
  source-of-truth model, commands, Firebase env vars, next steps. It links to
  the docs site instead of duplicating the full schema reference.
- **Test approach**: keep the existing `vi.mock("node:fs", ...)` but spread in
  the real module (`vi.importActual`) so `readFileSync` still works, and assert
  that `AGENTS.md` is written.

## Risks / Trade-offs

- [Reading a file at runtime couples the scaffold to the template existing in
  the installed package] → the package has no `files` allowlist, so `AGENTS.md`
  is always published; if it's ever missing, `scaffold()` should fail loudly
  rather than write a broken project.
- [Docs content drifts from the real generated app] → content is kept concise
  and points to the docs site; the gotchas section is verified against
  `@blazing-cms/schema` builders before writing.
