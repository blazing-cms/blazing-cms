# @blazing-cms/cms

## 0.3.1

### Patch Changes

- 298bd19: Fix admin login race condition: force-refresh ID token on admin-claim check, replace stale-closure post-login handler with effect-driven navigation, and add loading state during claim check
  - @blazing-cms/generators@0.3.1
  - @blazing-cms/schema@0.3.1
  - @blazing-cms/types@0.3.1

## 0.3.0

### Minor Changes

- 000e6c2: Add Google sign-in, admin-only login enforcement, and admin claim route guard

### Patch Changes

- @blazing-cms/generators@0.3.0
- @blazing-cms/schema@0.3.0
- @blazing-cms/types@0.3.0

## 0.2.2

### Patch Changes

- 24ddaaa: fix(promote): load VITE_FIREBASE_PROJECT_ID from env and print debug info
  - @blazing-cms/generators@0.2.2
  - @blazing-cms/schema@0.2.2
  - @blazing-cms/types@0.2.2

## 0.2.1

### Patch Changes

- ba5f515: Fix `useDataProvider must be used within a DataProviderWrapper` (and similar context errors) in generated projects. The admin dev server serves its source from inside `node_modules`, where Vite's dependency scanner pre-bundled every `@/` import resolving to a `.ts` file into separate chunks, duplicating module instances such as the data-provider context. The `@/` alias prefix is now excluded from dependency optimization so all admin source stays as regular modules.

  All packages are also aligned to a single shared version (0.2.0) via a fixed changesets version group.

- Updated dependencies [ba5f515]
  - @blazing-cms/generators@0.2.1
  - @blazing-cms/schema@0.2.1
  - @blazing-cms/types@0.2.1

## 0.2.0

### Minor Changes

- 83809fa: feat: promote users to admin via Firebase custom claims

  - Add `blaze promote <uid-or-email>` CLI command — sets the `role: "admin"` custom claim via the Firebase Admin SDK, preserving existing claims
  - Add `--check` flag — reports whether a user already has the admin role (exit 0 = admin, 1 = not admin)
  - RBAC context now reads ID token custom claims; users with the admin claim receive super-admin grants and `hasAdminRole` is exposed on `usePermissions()`
  - Add `firebase-admin` dependency to `@blazing-cms/cms` (lazily imported only by the promote command)

### Patch Changes

- b80da98: chore: exclude source and test files from published packages

  - Add whitelist .npmignore to all packages so tarballs ship only dist (+ bin for CLI packages) and CHANGELOG.md
  - Remove files field from package.json so .npmignore exclusions apply inside dist, dropping compiled test artifacts
  - Keep cms runtime src (required by blaze dev/build at runtime) while stripping its tests, **generated**, and dev configs
  - Add packaging test asserting tarball contents for all 10 packages
  - Run build before tests in CI so the packaging test sees dist output

- Updated dependencies [b80da98]
- Updated dependencies [83809fa]
  - @blazing-cms/generators@0.1.8
  - @blazing-cms/schema@0.1.8
  - @blazing-cms/types@0.1.8

## 0.1.7

### Patch Changes

- ec1159a: fix(cms): move vite plugins to dependencies so consuming projects can resolve them

  - Move @vitejs/plugin-react and @tailwindcss/vite from devDependencies to dependencies
  - These are imported in src/admin/vite.config.ts which ships with the package

## 0.1.6

### Patch Changes

- 3b28e86: refactor: move schema definitions from cms/ to src/cms/

  - Update default schema directory from "cms" to "src/cms" across all commands and loaders
  - Update create-app template to scaffold src/cms/ instead of cms/
  - Update AGENTS.md documentation

- Updated dependencies [3b28e86]
  - @blazing-cms/schema@0.1.6
  - @blazing-cms/generators@0.1.6

## 0.1.5

### Patch Changes

- c5e68c3: fix(create-app): use valid field types and ship cms commands source

  - Replace status() with select() for posts collection status field
  - Replace image() with media() for site-settings logo field
  - Fix slug sourceField to source property name
  - Add src/commands to cms package files array for Vite runtime resolution

- Updated dependencies [c5e68c3]
  - @blazing-cms/generators@0.1.5
  - @blazing-cms/schema@0.1.5
  - @blazing-cms/types@0.1.5

## 0.1.4

### Patch Changes

- 6a70e20: Fix create-app scaffold: add missing @blazing-cms/schema dependency and ship src/admin/ in cms package for dev/generate commands.
- Updated dependencies [6a70e20]
  - @blazing-cms/generators@0.1.4
  - @blazing-cms/schema@0.1.4
  - @blazing-cms/types@0.1.4

## 0.1.3

### Patch Changes

- 91b19fc: Fix scaffold crashing when AGENTS.md is not found in the published package. The template is now embedded as a fallback.
- Updated dependencies [91b19fc]
  - @blazing-cms/generators@0.1.3
  - @blazing-cms/schema@0.1.3
  - @blazing-cms/types@0.1.3

## 0.1.2

### Patch Changes

- 39af37c: emit AGENTS.md into generated projects
- Updated dependencies [39af37c]
  - @blazing-cms/generators@0.1.2
  - @blazing-cms/schema@0.1.2
  - @blazing-cms/types@0.1.2

## 0.1.1

### Patch Changes

- 3e1f7f8: initial publish
- Updated dependencies [3e1f7f8]
  - @blazing-cms/generators@0.1.1
  - @blazing-cms/types@0.1.1
  - @blazing-cms/schema@0.1.1
