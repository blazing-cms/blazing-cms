## 1. Auth Provider — Google Sign-In & Admin Check

- [x] 1.1 Add `GoogleAuthProvider` and `signInWithPopup` imports to `packages/cms/src/admin/lib/auth.tsx`
- [x] 1.2 Add `loginWithGoogle` method to `AuthContextValue` interface and `AuthProvider`
- [x] 1.3 Add `isAdmin: boolean` and `adminChecked: boolean` to `AuthContextValue`
- [x] 1.4 After `onAuthStateChanged` fires with a user, call `user.getIdTokenResult()` and set `isAdmin` based on `isAdminClaim(result.claims)`
- [x] 1.5 Export the new context values from `AuthProvider`

## 2. Login Page — Google Button & Admin Enforcement

- [x] 2.1 Add "Sign in with Google" button to `packages/cms/src/admin/routes/login.tsx` with Google icon
- [x] 2.2 Wire the Google button to call `loginWithGoogle()` from `useAuth()`
- [x] 2.3 After successful login (email or Google), check `isAdmin` — if false, show "Access denied" toast, call `logout()`, and stay on login page
- [x] 2.4 Add separator or visual distinction between email/password form and Google button

## 3. Route Guard — Admin-Only Access

- [x] 3.1 Update `AppLayout` in `packages/cms/src/admin/components/app-layout.tsx` to use `isAdmin` and `adminChecked` from `useAuth()`
- [x] 3.2 Redirect non-admin authenticated users to `/login` with "Access denied — admin access required" toast
- [x] 3.3 Ensure loading state covers both auth check and admin claim check

## 4. Tests

- [x] 4.1 Test `AuthProvider`: `isAdmin` is true when user has `role: admin` claim
- [x] 4.2 Test `AuthProvider`: `isAdmin` is false when user lacks admin claim
- [x] 4.3 Test `AuthProvider`: `loginWithGoogle` calls `signInWithPopup` with `GoogleAuthProvider`
- [x] 4.4 Test `AppLayout`: redirects non-admin users to `/login`
- [x] 4.5 Test login page: shows toast and signs out non-admin users after login
