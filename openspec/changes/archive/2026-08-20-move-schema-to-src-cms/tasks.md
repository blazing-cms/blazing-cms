## 1. Move playground schema

- [x] 1.1 Create `apps/playground/src/cms/` directory
- [x] 1.2 Move `apps/playground/cms/` contents to `apps/playground/src/cms/`
- [x] 1.3 Remove empty `apps/playground/cms/` directory
- [x] 1.4 Update `apps/playground/tsconfig.json` include to `["src/cms"]` (N/A - no tsconfig)

## 2. Update CMS package paths

- [x] 2.1 Update `packages/cms/src/commands/generate.ts:275` default from `"cms"` to `"src/cms"`
- [x] 2.2 Update `packages/cms/src/commands/scaffold.ts:81` from `"cms"` to `"src/cms"`
- [x] 2.3 Update `packages/cms/src/commands/doctor.ts:9` default from `"cms"` to `"src/cms"`
- [x] 2.4 Update `packages/cms/src/commands/lint.ts:12` default from `"cms"` to `"src/cms"`
- [x] 2.5 Update `packages/cms/src/admin/vite-plugins/schema-writer.ts:8` from `"cms"` to `"src/cms"`

## 3. Update schema loader

- [x] 3.1 Update `packages/schema/src/loader.ts:21` default from `"cms"` to `"src/cms"`

## 4. Update create-app template

- [x] 4.1 Update template to create `src/cms/` instead of `cms/`
- [x] 4.2 Update tsconfig template to include `["src/cms"]` (done in 4.1)

## 5. Update documentation

- [x] 5.1 Update AGENTS.md references from `cms/` to `src/cms/`
