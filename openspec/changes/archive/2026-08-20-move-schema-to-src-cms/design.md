## Context

The CMS uses a `cms/` folder at the project root to store schema definitions. This folder is referenced by 7 hardcoded paths across the codebase. Moving it to `src/cms/` aligns with standard conventions where all source code lives under `src/`.

## Goals / Non-Goals

**Goals:**

- Move schema definitions from `cms/` to `src/cms/`
- Update all path references to use the new location
- Maintain all existing functionality

**Non-Goals:**

- Change schema loading behavior
- Modify the schema definition API
- Refactor the command structure

## Decisions

**1. Path constant in schema-writer.ts**

- Use `"src/cms"` instead of `"cms"` for `SCHEMA_ROOT`
- This is the only runtime reference; others are CLI defaults

**2. CLI default paths**

- Update `generate.ts`, `doctor.ts`, `lint.ts` to default to `"src/cms"` instead of `"cms"`
- Users can still override via `--dir` flag

**3. Scaffold command**

- Create `src/cms/` directory structure instead of `cms/`
- Update tsconfig to include `["src/cms"]`

**4. create-app template**

- Generate `src/cms/` with schema files
- Update tsconfig include

## Risks / Trade-offs

- **Breaking change**: Existing projects must manually move their `cms/` folder to `src/cms/`
  - Mitigation: Pre-1.0, acceptable; document in changelog
- **Tooling**: Any external tools referencing `cms/` will break
  - Mitigation: Not a concern pre-launch
