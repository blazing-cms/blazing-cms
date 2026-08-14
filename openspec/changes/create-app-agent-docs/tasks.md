# Create-App Agent Docs — Tasks

## 1. Author the generated-app docs template

- [ ] 1.1 Rewrite `packages/create-app/AGENTS.md` as docs for a generated Blazing CMS app (not the create-app package): project layout, schema-as-source-of-truth, commands, Firebase env config, next steps
- [ ] 1.2 Keep the content accurate against the current schema DSL and CLI (`blaze dev/build/generate/deploy/scaffold`), pointing to the docs site for details

## 2. Emit AGENTS.md from the scaffold

- [ ] 2.1 Update `scaffold()` in `packages/create-app/src/index.ts` to read `AGENTS.md` from the package (`new URL("../AGENTS.md", import.meta.url)`) and write it to the project root via `createFile`
- [ ] 2.2 Update the scaffold tests so `node:fs` keeps a real `readFileSync` (`vi.importActual` spread) and assert `AGENTS.md` is written at the project root

## 3. Verify

- [ ] 3.1 Run `pnpm --filter @blazing-cms/create-app typecheck` and `pnpm --filter @blazing-cms/create-app test`
- [ ] 3.2 Run `openspec validate create-app-agent-docs`
- [ ] 3.3 Regenerate a sample app and confirm `AGENTS.md` is present
