# Create-App AI Agent Docs — Tasks

## 1. Author the agent documentation

- [ ] 1.1 Create `packages/create-app/AGENTS.md` covering package identity (name, version, bin entry, main entry)
- [ ] 1.2 Document the source layout: `src/index.ts`, `bin/create-blazing-cms-app.js`, `src/__tests__/`, `dist/`
- [ ] 1.3 Document how `scaffold()` works: directory structure it creates, the `createFile`/`makePrompt` helpers, and the `trimStart()` template convention
- [ ] 1.4 Document the dev workflow commands (build, test, typecheck, lint) for this package
- [ ] 1.5 Document testing conventions: vitest with mocked `node:fs` and `node:readline`
- [ ] 1.6 Add a gotchas section flagging the outdated schema DSL in the example templates (`required`, `sourceField`, `status()`, `image()`) versus current `@blazing-cms/schema` builders (`validation`, `source`, `media`/`upload`), and that template changes belong to a separate schema-DSL-sync change

## 2. Verify

- [ ] 2.1 Confirm all claims in AGENTS.md match `src/index.ts`, `bin/`, and the test files
- [ ] 2.2 Run `pnpm --filter @blazing-cms/create-app typecheck` and `pnpm --filter @blazing-cms/create-app test`
- [ ] 2.3 Run `openspec validate` on the change
