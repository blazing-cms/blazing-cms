---
"@blazing-cms/cms": patch
"@blazing-cms/create-app": patch
"@blazing-cms/core": patch
"@blazing-cms/generators": patch
"@blazing-cms/permissions": patch
"@blazing-cms/plugins": patch
"@blazing-cms/schema": patch
"@blazing-cms/sdk": patch
"@blazing-cms/types": patch
"@blazing-cms/validation": patch
---

fix(create-app): use valid field types and ship cms commands source

- Replace status() with select() for posts collection status field
- Replace image() with media() for site-settings logo field
- Fix slug sourceField to source property name
- Add src/commands to cms package files array for Vite runtime resolution
