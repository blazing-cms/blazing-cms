---
"@blazing-cms/cms": minor
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

feat: promote users to admin via Firebase custom claims

- Add `blaze promote <uid-or-email>` CLI command — sets the `role: "admin"` custom claim via the Firebase Admin SDK, preserving existing claims
- Add `--check` flag — reports whether a user already has the admin role (exit 0 = admin, 1 = not admin)
- RBAC context now reads ID token custom claims; users with the admin claim receive super-admin grants and `hasAdminRole` is exposed on `usePermissions()`
- Add `firebase-admin` dependency to `@blazing-cms/cms` (lazily imported only by the promote command)
