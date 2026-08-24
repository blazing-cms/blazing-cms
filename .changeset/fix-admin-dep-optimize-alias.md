---
"@blazing-cms/cms": patch
"@blazing-cms/core": patch
"@blazing-cms/create-app": patch
"@blazing-cms/generators": patch
"@blazing-cms/permissions": patch
"@blazing-cms/plugins": patch
"@blazing-cms/schema": patch
"@blazing-cms/sdk": patch
"@blazing-cms/types": patch
"@blazing-cms/validation": patch
---

Fix `useDataProvider must be used within a DataProviderWrapper` (and similar context errors) in generated projects. The admin dev server serves its source from inside `node_modules`, where Vite's dependency scanner pre-bundled every `@/` import resolving to a `.ts` file into separate chunks, duplicating module instances such as the data-provider context. The `@/` alias prefix is now excluded from dependency optimization so all admin source stays as regular modules.

All packages are also aligned to a single shared version (0.2.0) via a fixed changesets version group.
