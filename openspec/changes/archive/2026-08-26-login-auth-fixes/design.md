## Context

The admin panel uses Firebase Auth (client SDK) with a React context (`AuthProvider`) that exposes `login(email, password)`, `logout()`, `user`, and `loading`. The route guard in `AppLayout` only checks `user !== null`. The RBAC context (`RbacProvider`) already calls `user.getIdTokenResult()` to check for the `role: admin` custom claim, but this happens _inside_ the app layout — after the user has already gained access to the route tree.

The `admin-claims.ts` module provides `isAdminClaim()` which checks `claims.role === "admin"` or `claims.admin === true`.

## Goals / Non-Goals

**Goals:**

- Add Google sign-in as an authentication method alongside email/password
- Enforce admin-only access at both the login page and the route guard
- Keep the auth context as the single source of truth for auth state and admin status

**Non-Goals:**

- Changing the RBAC permission system or Firestore security rules
- Adding other OAuth providers (GitHub, Apple, etc.)
- Implementing admin claim auto-promotion for the first user (already handled by `RbacProvider` bootstrap)

## Decisions

### 1. Add `loginWithGoogle()` to AuthProvider

**Decision**: Add a new `loginWithGoogle` method to `AuthContextValue` that creates a `GoogleAuthProvider`, calls `signInWithPopup(auth, provider)`, and returns.

**Why**: `signInWithPopup` is the simplest flow for a desktop SPA — no redirect/return URL handling needed. The `GoogleAuthProvider` class is already available in the `firebase/auth` SDK (no new dependency).

**Alternative considered**: `signInWithRedirect` — avoids popup blockers but adds complexity with redirect result handling and is worse UX for SPAs.

### 2. Expose `adminChecked` and `isAdmin` from AuthProvider

**Decision**: After `onAuthStateChanged` fires, immediately call `user.getIdTokenResult()` to check the `role: admin` custom claim. Expose `isAdmin: boolean` and a new `adminChecked: boolean` from the auth context.

**Why**: The route guard and login page both need to know admin status before rendering content. Putting this in `AuthProvider` avoids duplicating the claim check in multiple places. The RBAC context can continue to use its own richer claim + grant loading — this is just the fast gate check.

**Alternative considered**: Check claims in `AppLayout` directly — rejected because it duplicates logic and creates a flash of content before the check completes.

### 3. Route guard checks `adminChecked` + `isAdmin`

**Decision**: `AppLayout` redirects to `/login` if `!loading && !user`, and additionally if `adminChecked && !isAdmin`. Show a toast on the non-admin redirect.

**Why**: Catches both unauthenticated and non-admin users at the route level. The `adminChecked` flag prevents a false redirect before the claim check completes.

### 4. Login page enforces admin claim immediately

**Decision**: After successful `login()` or `loginWithGoogle()`, call `user.getIdTokenResult()` to check the admin claim. If not admin, show toast, call `logout()`, and stay on login page.

**Why**: Gives immediate feedback instead of letting the user log in only to be bounced by the route guard. Prevents the confusing UX of "signed in but can't see anything."

### 5. `isAdmin` state is separate from RBAC grants

**Decision**: The `isAdmin` in `AuthProvider` is a simple boolean from the custom claim. The RBAC context's `hasAdminRole` is a richer check that also loads Firestore grants. Both coexist — `AuthProvider.isAdmin` is the fast gate, `usePermissions().hasAdminRole` is the detailed permission check.

**Why**: Avoids coupling the route guard to the RBAC provider (which depends on `DataProvider` and may not be ready at login time).

## Risks / Trade-offs

- **Claim propagation delay** → After `blaze promote` sets the claim, the user must re-login for the ID token to reflect the new claim. This is a Firebase Auth limitation (claims propagate on next token mint). **Mitigation**: Documented in promote command output; the login page will show "Access denied" until re-login.

- **Popup blocker** → `signInWithPopup` can be blocked by browser popup blockers. **Mitigation**: User gesture (button click) satisfies most popup blocker policies. If blocked, Firebase throws a clear error that surfaces in the toast.

- **Breaking change** → Non-admin Firebase Auth users who previously had CMS access will now be denied. **Mitigation**: This is the intended behavior. The promote command exists to grant admin access.

## Migration Plan

1. Deploy the code change
2. Ensure Google sign-in provider is enabled in Firebase Console > Authentication > Sign-in method
3. Existing admin users (those with `role: admin` claim) are unaffected
4. Non-admin users will need to be promoted via `blaze promote <uid-or-email>` before they can access the CMS

## Open Questions

_(none — all decisions resolved)_
