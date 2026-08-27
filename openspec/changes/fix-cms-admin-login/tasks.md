## 1. Force-refresh the admin-claim check

- [ ] 1.1 In `packages/cms/src/admin/lib/auth.tsx`, change `checkAdminClaim` to call `user.getIdTokenResult(true)` so custom claims set via `setCustomUserClaims` are picked up on next sign-in
- [ ] 1.2 In `packages/cms/src/admin/lib/rbac/context.tsx`, change `loadAdminClaim` to call `user.getIdTokenResult(true)` (and update its inline type if needed)

## 2. Fix the post-login stale-closure race in the login page

- [ ] 2.1 In `packages/cms/src/admin/routes/login.tsx`, remove `handlePostLogin()` and replace its inline call sites (in `handleSubmit` and `handleGoogleSignIn`) with setting a local `pending` flag after a successful sign-in
- [ ] 2.2 Add an effect that, once `pending` is set and `user`/`adminChecked` are populated, navigates to `/` when `isAdmin`, otherwise shows the "Access denied — admin access required" toast and calls `logout()`, then clears `pending`
- [ ] 2.3 Add a `pending` state next to the existing `loading` state

## 3. Add a loading state to the login page

- [ ] 3.1 In `login.tsx`, keep the sign-in button and Google button disabled and their busy text active while `loading || pending` (e.g. `disabled={loading || pending}` and `{loading || pending ? "Signing in..." : "Sign In"}`)

## 4. Update the auth spec to match new behavior

- [ ] 4.1 Update `openspec/specs/auth/spec.md`: correct the "Admin user proceeds after login" scenario to remove the guaranteed logout, add a "Just-promoted admin recognized" scenario, and add a "Loading state during post-login claim check" requirement with its scenarios

## 5. Changeset and verification

- [ ] 5.1 Add a `.changeset/*.md` file (package `@blazing-cms/cms`, patch bump) describing the admin-login fix
- [ ] 5.2 Run `pnpm --filter @blazing-cms/cms typecheck` (or the repo typecheck script); all pass
- [ ] 5.3 Run the CMS package tests (`pnpm --filter @blazing-cms/cms test`); all pass
- [ ] 5.4 Verify manually: sign in as a user with `{"role":"admin"}` custom claim and confirm navigation to the dashboard with no denial toast and no button flicker; sign in as a non-admin and confirm the denial toast and sign-out
