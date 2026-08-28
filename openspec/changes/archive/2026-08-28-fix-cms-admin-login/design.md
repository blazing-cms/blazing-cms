## Context

See `proposal.md` — Why. The bug is a stale-closure race in
`packages/cms/src/admin/routes/login.tsx`:

- `handlePostLogin()` (lines 30–41) is called synchronously in the same microtask
  right after `await login(...)`/`await loginWithGoogle()` resolves.
- It reads `isAdmin` from the render closure that submitted the form, where
  `isAdmin` is still `false`.
- Meanwhile `AuthProvider`'s `onAuthStateChanged` callback (auth.tsx:65–79) fires
  but `await`s `getIdTokenResult()` before calling `setIsAdmin`, so the fresh
  value lands only on a later re-render that `handlePostLogin` can never see.
- The effect at login.tsx:26–28 was intended as the fallback navigation, but
  `handlePostLogin`'s unconditional `logout()` (line 40) signs the admin out first.

Secondary: `checkAdminClaim` (auth.tsx:50–57) and `loadAdminClaim` in
`packages/cms/src/admin/lib/rbac/context.tsx` call `getIdTokenResult()` without
`true`, so claims set via `setCustomUserClaims` are not honored until a token
refresh — a just-promoted admin signing in fresh may still see an outdated token.

## Goals / Non-Goals

**Goals:**

- Make post-login admin access decisions read fresh, force-refreshed auth context
  state rather than a stale render closure.
- Force an ID-token refresh when checking the admin claim, so newly promoted
  admins are recognized on sign-in.
- Show a stable loading/busy state on the login page while the claim check runs.

**Non-Goals:**

- Consolidating the duplicate Firebase app initializations (`auth.tsx` vs
  `providers/firebase.ts`) — noted but out of scope for this fix.
- Changing Firestore security rules or the RBAC grant model.

## Decisions

### D1: Drive post-login outcome from an effect on fresh auth state

Instead of calling `handlePostLogin()` inline after sign-in, the submit handlers
only sign in and set a local `pending` flag. An effect observes `pending` along
with the auth context's `adminChecked`/`isAdmin`/`user` and, once the claim check
has settled:

- admin → `navigate({ to: "/" })`
- non-admin → denial toast + `logout()`

```tsx
const [pending, setPending] = useState(false);

useEffect(() => {
  if (!pending || !user || !adminChecked) return;
  if (isAdmin) navigate({ to: "/" });
  else {
    addToast({
      description: "Access denied — admin access required",
      title: "Access denied",
      variant: "destructive",
    });
    void logout();
  }
  setPending(false);
}, [pending, user, adminChecked, isAdmin, navigate, addToast, logout]);
```

Rationale: the effect runs after React re-renders with the freshly populated
context values, eliminating the stale closure. Alternative (forcing a token
refresh inside the submit handler and reading local claims) was rejected because
it duplicates the claim-checking logic that belongs in the auth context.

### D2: Force ID-token refresh on the admin-claim check

Change `user.getIdTokenResult()` to `user.getIdTokenResult(true)` in both
`auth.tsx` `checkAdminClaim` and `rbac/context.tsx` `loadAdminClaim`. This fetches
a fresh token carrying any recently set custom claims, so a user promoted via
`setCustomUserClaims` is recognized on the next sign-in.

Rationale: with D1, the claim check must reflect the current server state.
Alternative (relying on the implicit refresh on sign-in) is unreliable for users
already signed in when promoted.

### D3: Loading state tied to the pending post-login check

Keep the sign-in and Google buttons disabled and their busy text active while
`loading || pending`. The `pending` flag is only cleared once the claim check
resolves and the effect acts. This removes the flicker between "Signing in..." and
the denial/dashboard transition.

## Risks / Trade-offs

- **Extra network round-trip per check** — `getIdTokenResult(true)` forces a token
  refresh on every auth-check, adding latency on each state resolution.
  → Mitigation: acceptable for an admin-only control surface; Firebase caches the
  refreshed token and subsequent calls without force-refresh reuse it.
- **Effect could fire after component unmount** — navigating away mid-check leaves
  a stale `setPending(false)`.
  → Mitigation: navigation replaces the login route; the effect's guard conditions
  make an unmounted stale update harmless in practice.

## Migration Plan

Deploy the admin bundle (`blaze build` + hosting). The `handlePostLogin` removal
is internal to the login flow; no stored data or API contract changes. Rollback
is a re-deploy of the previous bundle.

## Open Questions

None. The approach, specs, and task breakdown are fully determined.
