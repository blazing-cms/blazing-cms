# @blazing-cms/validation

## 0.3.0

### Patch Changes

- @blazing-cms/types@0.3.0

## 0.2.2

### Patch Changes

- @blazing-cms/types@0.2.2

## 0.2.1

### Patch Changes

- ba5f515: Fix `useDataProvider must be used within a DataProviderWrapper` (and similar context errors) in generated projects. The admin dev server serves its source from inside `node_modules`, where Vite's dependency scanner pre-bundled every `@/` import resolving to a `.ts` file into separate chunks, duplicating module instances such as the data-provider context. The `@/` alias prefix is now excluded from dependency optimization so all admin source stays as regular modules.

  All packages are also aligned to a single shared version (0.2.0) via a fixed changesets version group.

- Updated dependencies [ba5f515]
  - @blazing-cms/types@0.2.1

## 0.1.8

### Patch Changes

- b80da98: chore: exclude source and test files from published packages

  - Add whitelist .npmignore to all packages so tarballs ship only dist (+ bin for CLI packages) and CHANGELOG.md
  - Remove files field from package.json so .npmignore exclusions apply inside dist, dropping compiled test artifacts
  - Keep cms runtime src (required by blaze dev/build at runtime) while stripping its tests, **generated**, and dev configs
  - Add packaging test asserting tarball contents for all 10 packages
  - Run build before tests in CI so the packaging test sees dist output

- 83809fa: feat: promote users to admin via Firebase custom claims

  - Add `blaze promote <uid-or-email>` CLI command — sets the `role: "admin"` custom claim via the Firebase Admin SDK, preserving existing claims
  - Add `--check` flag — reports whether a user already has the admin role (exit 0 = admin, 1 = not admin)
  - RBAC context now reads ID token custom claims; users with the admin claim receive super-admin grants and `hasAdminRole` is exposed on `usePermissions()`
  - Add `firebase-admin` dependency to `@blazing-cms/cms` (lazily imported only by the promote command)

- Updated dependencies [b80da98]
- Updated dependencies [83809fa]
  - @blazing-cms/types@0.1.8

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
