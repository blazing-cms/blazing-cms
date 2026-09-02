## Why

A user who has been promoted to admin (Firebase custom claim `{"role":"admin"}`)
still cannot log in to the CMS. They sign in successfully but are immediately
shown "Access denied — admin access required" and signed back out. The "signing
in" state also drops instantly, causing a visible flicker before the denial.

## What Changes

- **Fix the admin-login race condition**: after a successful sign-in, `login.tsx`
  currently calls `handlePostLogin()` synchronously, which reads a stale
  `isAdmin === false` value from the render closure. The auth context's async
  `getIdTokenResult()` claim check (in `auth.tsx`) has not populated fresh state
  yet, so even a genuine admin is denied and logged out. Post-login access
  decisions are moved to an effect that observes fresh auth state, so the admin
  is navigated to the dashboard instead of being logged out.
- **Force-refresh the ID token on the admin-claim check**: `getIdTokenResult()`
  is called without `true` in both `auth.tsx` and the RBAC context. Custom claims
  set via `setCustomUserClaims` only reach the client on a token refresh; passing
  `true` forces a fresh token so a just-promoted admin is recognized immediately.
- **Add a loading state to the login page**: keep the submit button/Google button
  disabled and the busy state active while the admin-claim check is pending, so
  there is no flicker between "Signing in..." and a denial/dashboard transition.

## Capabilities

### New Capabilities

<!-- None. No new capability is introduced. -->

### Modified Capabilities

- `auth`: the "Admin user proceeds after login" and "Non-admin user denied after
  login" behaviors change so the decision is made on fresh, force-refreshed auth
  claims rather than a stale render closure, and the login page shows a loading
  state while that check runs.

## Impact

- `packages/cms/src/admin/routes/login.tsx` — restructure post-login handling and
  add a pending/loading state.
- `packages/cms/src/admin/lib/auth.tsx` — force-refresh ID token in
  `checkAdminClaim` via `getIdTokenResult(true)`.
- `packages/cms/src/admin/lib/rbac/context.tsx` — force-refresh ID token in
  `loadAdminClaim` via `getIdTokenResult(true)`.
- `openspec/specs/auth/spec.md` — update the corresponding auth scenarios.
- Changeset: add `.changeset/*.md` documenting the admin-login fix.
- Verification: sign in as a promoted admin and confirm navigation to the
  dashboard with no denial toast and no button flicker.
