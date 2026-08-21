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

chore: exclude source and test files from published packages

- Add whitelist .npmignore to all packages so tarballs ship only dist (+ bin for CLI packages) and CHANGELOG.md
- Remove files field from package.json so .npmignore exclusions apply inside dist, dropping compiled test artifacts
- Keep cms runtime src (required by blaze dev/build at runtime) while stripping its tests, **generated**, and dev configs
- Add packaging test asserting tarball contents for all 10 packages
- Run build before tests in CI so the packaging test sees dist output
