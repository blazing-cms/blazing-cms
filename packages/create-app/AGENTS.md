# AGENTS.md — `@blazing-cms/create-app`

Agent-oriented documentation for the project scaffolding CLI. Read this before
editing anything in `packages/create-app/`.

## What this package is

`@blazing-cms/create-app` (v0.1.1) is the bootstrap CLI that creates a new
Blazing CMS project. It is a single-purpose package: one `scaffold()` function
plus a thin `bin/` wrapper. There is no admin UI, no SDK, and no Firebase code
here — only template files written to disk.

## Identity and invocation

- Package name: `@blazing-cms/create-app`
- Bin entry: `bin/create-blazing-cms-app.js` (invoked as
  `npx @blazing-cms/create-app <project-name>`)
- Main entry: `dist/index.js` (compiled from `src/index.ts` by `tsc`)
- The bin prints usage and exits when invoked with no args or `--help`

## Source layout

```
packages/create-app/
  bin/create-blazing-cms-app.js   # argv parsing; calls scaffold(projectName)
  src/index.ts                    # the entire implementation
  src/__tests__/
    index.test.ts                 # scaffold tests
    scaffold.test.ts              # scaffold tests
  dist/                           # compiled output (build artifacts, do not edit)
```

## How `scaffold()` works (`src/index.ts`)

- Resolves `<projectName>` under `process.cwd()` and **exits with code 1** if the
  directory already exists (`existsSync`).
- Prompts for a display name via `makePrompt()` (readline); empty input falls
  back to the project name.
- Creates `cms/collections`, `cms/globals`, and `src` directories with
  `mkdirSync(..., { recursive: true })`.
- Writes every file through the `createFile(dir, name, content)` helper, which
  writes the content with `.trimStart()` and logs `✓ Created <name>` via
  `console.warn`.

Files written:

| File                           | Purpose                                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `package.json`                 | `dev`/`build`/`deploy`/`generate`/`scaffold` scripts calling `blaze`; deps `@blazing-cms/cms` (latest) and `firebase` |
| `tsconfig.json`                | Strict, ESNext, `noEmit`, includes `cms`                                                                              |
| `blazing-cms.config.ts`        | `defineConfig` reading Firebase values from `process.env.VITE_FIREBASE_*`                                             |
| `.env`                         | `VITE_FIREBASE_*` placeholders, `VITE_BACKEND_MODE=firebase`                                                          |
| `.env.example`                 | Documented placeholder env vars                                                                                       |
| `.gitignore`                   | `node_modules/`, `dist/`, `.env`, `firebase-debug.log`                                                                |
| `cms/collections/posts.ts`     | Example collection template                                                                                           |
| `cms/globals/site-settings.ts` | Example global template                                                                                               |

## Development workflow

All commands run from the repo root:

```bash
pnpm --filter @blazing-cms/create-app build       # tsc -> dist/
pnpm --filter @blazing-cms/create-app dev         # tsc --watch
pnpm --filter @blazing-cms/create-app test        # vitest run
pnpm --filter @blazing-cms/create-app typecheck   # tsc --noEmit
pnpm --filter @blazing-cms/create-app lint        # tsc --noEmit
```

## Testing conventions

- Vitest; tests live in `src/__tests__/`.
- `node:fs` and `node:readline` are mocked via `vi.mock` — `existsSync`,
  `mkdirSync`, and `writeFileSync` never touch the real filesystem, and the
  display-name prompt auto-answers `"My Project"`.
- Tests assert on the args of `writeFileSync` calls (file paths + content
  substrings), so template changes are covered by `scaffold.test.ts` /
  `index.test.ts`. Update those assertions when changing templates.
- Never run the real scaffolder against a working directory you care about —
  it writes files relative to `process.cwd()`.

## Gotchas

- **The example schema templates are out of date with `@blazing-cms/schema`.**
  `cms/collections/posts.ts` uses `text("title", { required: true })`,
  `slug("slug", { sourceField: "title" })`, and `status()`; the global uses
  `image("logo")`. The current DSL (see `packages/schema/src/fields.ts`) uses
  `validation: { required: true }`, `slug("slug", { source: "title" })`, and
  `media(...)` / `upload(...)` builders — there is **no** `status()` or
  `image()` builder. Treat the templates as known-drift, not as authoritative
  examples. Fixing them is a separate schema-DSL-sync change; do not bundle it
  into unrelated work without being asked.
- Templates are template-literal strings; `createFile` applies `.trimStart()`,
  so leading blank lines in a template literal are stripped. Keep template
  indentation intentional.
- User-facing output goes through `console.warn`, not `console.log` — match
  that style.
- The bin imports `../dist/index.js` (compiled output), so always run
  `build` before manually testing the CLI locally.
