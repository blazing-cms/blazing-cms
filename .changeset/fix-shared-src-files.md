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

fix(cms): ship src/shared in package for Vite runtime resolution

- Add src/shared to cms package files array so generate.ts can resolve shared/capabilities.js and shared/workflow.js at runtime
