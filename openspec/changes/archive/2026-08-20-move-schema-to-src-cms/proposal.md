## Why

The `cms/` folder sits at the project root alongside `src/`, which is unconventional for a monorepo. Moving it to `src/cms/` aligns with standard project structure where all source code lives under `src/`.

## What Changes

- Move schema definitions from `cms/` to `src/cms/` in all apps (playground, generated projects)
- Update all hardcoded `"cms"` path references to `"src/cms"` across the codebase
- Update create-app template to scaffold `src/cms/` instead of `cms/`

## Capabilities

### New Capabilities

None - this is a pure structural refactor.

### Modified Capabilities

None - no behavior changes, only directory structure.

## Impact

- **Packages affected**: `@blazing-cms/schema` (loader), `@blazing-cms/cms` (commands, vite plugin), `@blazing-cms/create-app` (template)
- **Apps affected**: playground, all generated projects
- **Config changes**: tsconfig `include` arrays, path references in commands
- **Breaking**: Yes (pre-1.0, acceptable)
