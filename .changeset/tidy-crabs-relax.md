---
"@blazing-cms/cms": patch
---

Fix `blaze dev`/`build` failing with "Cannot resolve entry module .../src/admin/vite.config.ts" after the published package dropped its runtime source. The admin SPA is compiled at runtime from the package's own `src/admin` (it statically imports per-project generated schema files), so the cms tarball must ship the executable admin source. The packaging now ships that runtime source while excluding tests, the runtime-generated `__generated__` directory, and the dev-only `vite-env.d.ts`. Adds packaging tests guarding this contract.
