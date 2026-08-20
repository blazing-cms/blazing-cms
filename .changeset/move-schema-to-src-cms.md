---
"@blazing-cms/create-app": patch
"@blazing-cms/schema": patch
"@blazing-cms/cms": patch
---

refactor: move schema definitions from cms/ to src/cms/

- Update default schema directory from "cms" to "src/cms" across all commands and loaders
- Update create-app template to scaffold src/cms/ instead of cms/
- Update AGENTS.md documentation
