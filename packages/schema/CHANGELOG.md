# @blazing-cms/schema

## 0.1.6

### Patch Changes

- 3b28e86: refactor: move schema definitions from cms/ to src/cms/

  - Update default schema directory from "cms" to "src/cms" across all commands and loaders
  - Update create-app template to scaffold src/cms/ instead of cms/
  - Update AGENTS.md documentation

## 0.1.5

### Patch Changes

- c5e68c3: fix(create-app): use valid field types and ship cms commands source

  - Replace status() with select() for posts collection status field
  - Replace image() with media() for site-settings logo field
  - Fix slug sourceField to source property name
  - Add src/commands to cms package files array for Vite runtime resolution

- Updated dependencies [c5e68c3]
  - @blazing-cms/types@0.1.5

## 0.1.4

### Patch Changes

- 6a70e20: Fix create-app scaffold: add missing @blazing-cms/schema dependency and ship src/admin/ in cms package for dev/generate commands.
- Updated dependencies [6a70e20]
  - @blazing-cms/types@0.1.4

## 0.1.3

### Patch Changes

- 91b19fc: Fix scaffold crashing when AGENTS.md is not found in the published package. The template is now embedded as a fallback.
- Updated dependencies [91b19fc]
  - @blazing-cms/types@0.1.3

## 0.1.2

### Patch Changes

- 39af37c: emit AGENTS.md into generated projects
- Updated dependencies [39af37c]
  - @blazing-cms/types@0.1.2

## 0.1.1

### Patch Changes

- 3e1f7f8: initial publish
- Updated dependencies [3e1f7f8]
  - @blazing-cms/types@0.1.1
