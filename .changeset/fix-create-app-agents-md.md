---
"@blazing-cms/create-app": patch
"@blazing-cms/cms": patch
"@blazing-cms/core": patch
"@blazing-cms/generators": patch
"@blazing-cms/permissions": patch
"@blazing-cms/plugins": patch
"@blazing-cms/schema": patch
"@blazing-cms/sdk": patch
"@blazing-cms/types": patch
"@blazing-cms/validation": patch
---

Fix scaffold crashing when AGENTS.md is not found in the published package. The template is now embedded as a fallback.
