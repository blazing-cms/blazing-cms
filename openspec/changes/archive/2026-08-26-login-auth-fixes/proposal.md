## Why

The login page currently only supports email/password authentication, and the route guard only checks whether a user is authenticated — not whether they have admin access. Any Firebase Auth user (even those without the `role: admin` custom claim) can access the full CMS. This needs to be locked down to admin-only users, and Google sign-in should be added as a convenience.

## What Changes

- **Google sign-in provider** — add `GoogleAuthProvider` and `signInWithPopup` to the auth context alongside email/password
- **Login page: Google button** — "Sign in with Google" button on the login page
- **Admin-only route guard** — `AppLayout` checks the `role: admin` custom claim via `getIdTokenResult()`; non-admin authenticated users are redirected to `/login` with an "access denied" message
- **Login page: admin claim enforcement** — if a user signs in but lacks the `role: admin` claim, show an "Access denied" toast and sign them out
- **Tests** — auth claim check, Google provider integration, login guard behavior

## Capabilities

### Modified Capabilities

- `auth`: Adding Google sign-in provider, admin-only route guard enforcement, and claim-based access denial on login

### New Capabilities

_(none — all changes fit within the existing auth capability)_

## Impact

- **Files modified**: `packages/cms/src/admin/lib/auth.tsx`, `packages/cms/src/admin/routes/login.tsx`, `packages/cms/src/admin/components/app-layout.tsx`
- **Dependencies**: none new — `GoogleAuthProvider` and `signInWithPopup` are already in the `firebase/auth` SDK (already a dependency)
- **Firebase Console**: Google sign-in provider must be enabled in Firebase Console > Authentication > Sign-in method (manual step, not code)
- **Existing behavior**: Users with email/password login are unaffected; Google sign-in is additive. The route guard change is **breaking** for any non-admin Firebase Auth user who previously could access the CMS.
