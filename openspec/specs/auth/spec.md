# Auth Specification

## Purpose

Provides authentication for the CMS using the Firebase Auth client SDK, with email/password and Google sign-in, auth state observation, admin claim enforcement, and a React context that propagates the authenticated user throughout the admin panel.

## Requirements

### Requirement: Users authenticate with Firebase client SDK

The system SHALL use Firebase Authentication via the client SDK, accepting email and password credentials through `signInWithEmailAndPassword`, and Google credentials through `signInWithPopup` with a `GoogleAuthProvider`.

#### Scenario: Successful email/password login

- **WHEN** a user enters valid email and password on the login page
- **THEN** the system calls `signInWithEmailAndPassword` and navigates to the dashboard

#### Scenario: Successful Google login

- **WHEN** a user clicks "Sign in with Google" and completes the Google OAuth popup
- **THEN** the system calls `signInWithPopup` with a `GoogleAuthProvider` and navigates to the dashboard

#### Scenario: Failed login shows error

- **WHEN** a user enters invalid email or password
- **THEN** the system catches the `AuthError` and displays an error toast with the Firebase error message

#### Scenario: Already authenticated redirects

- **WHEN** an already-authenticated user navigates to `/login`
- **THEN** the system redirects them to the dashboard

### Requirement: Auth state is observed reactively

The system SHALL use `onAuthStateChanged` to track the authentication state and expose the current user via a React context.

#### Scenario: Auth state listener on mount

- **WHEN** the app initializes
- **THEN** it registers an `onAuthStateChanged` listener that updates the auth context on state changes

#### Scenario: Authenticated user in context

- **WHEN** a user is signed in
- **THEN** the `useAuth` hook returns the current `User` object from Firebase Auth

#### Scenario: Null user when signed out

- **WHEN** no user is signed in
- **THEN** the `useAuth` hook returns `null`

### Requirement: Unauthenticated users are redirected to login

The system SHALL protect admin routes by redirecting unauthenticated users to the login page. The system SHALL additionally deny access to authenticated users who lack the `role: admin` custom claim.

#### Scenario: Route guard redirects unauthenticated users

- **WHEN** an unauthenticated user attempts to access any admin route
- **THEN** they are redirected to `/login` with their intended destination preserved

#### Scenario: Route guard denies non-admin users

- **WHEN** an authenticated user without the `role: admin` custom claim attempts to access any admin route
- **THEN** they are redirected to `/login` and an "Access denied — admin access required" toast is displayed

#### Scenario: Loading state during auth check

- **WHEN** the auth state is being determined (initial load)
- **THEN** a loading indicator is shown and routes are not rendered

### Requirement: Non-admin users are signed out on login

The system SHALL enforce admin-only access at the point of login, based on a fresh, force-refreshed ID token. If a user authenticates successfully but does not have the `role: admin` custom claim, the system SHALL sign them out and display an access-denied message. The decision SHALL be made only after the ID-token claim check has completed.

#### Scenario: Admin user proceeds after login

- **WHEN** a user signs in (via email/password or Google) and has the `role: admin` custom claim on their refreshed ID token
- **THEN** the system recognizes the admin from a fresh, force-refreshed ID token, navigates to the dashboard, and keeps the user signed in

#### Scenario: Just-promoted admin recognized

- **WHEN** a user's `role: admin` custom claim was set via `setCustomUserClaims` and the user signs in afterward
- **THEN** the system force-refreshes the ID token, recognizes the `role: admin` claim, and navigates to the dashboard

#### Scenario: Non-admin user denied after login

- **WHEN** a user signs in but does not have the `role: admin` custom claim on their refreshed ID token
- **THEN** the system displays an "Access denied — admin access required" toast, signs the user out, and remains on the login page

### Requirement: Loading state during post-login claim check

The system SHALL keep the login page in a non-interactive, busy state between a successful sign-in and the completion of the ID-token admin-claim check, to avoid a flicker of the idle form or a premature denial before the check completes.

#### Scenario: Busy state while claim check runs

- **WHEN** a user signs in and the ID-token admin-claim check is pending
- **THEN** the sign-in and Google buttons remain disabled and show a busy state until the check resolves

#### Scenario: Busy state cleared on result

- **WHEN** the ID-token admin-claim check resolves
- **THEN** the busy state is cleared, and the user is either navigated to the dashboard (admin) or shown the denial toast and signed out (non-admin)

### Requirement: Users can sign out

The system SHALL provide a sign-out mechanism that clears the auth state and redirects to the login page.

#### Scenario: Sign out

- **WHEN** a user clicks the sign-out button
- **THEN** `signOut` is called and the user is redirected to `/login`

### Requirement: Firebase Auth errors are surfaced appropriately

The system SHALL map common Firebase Auth errors to user-friendly messages.

#### Scenario: Wrong password

- **WHEN** a user enters an incorrect password
- **THEN** the system displays "Invalid email or password" rather than the raw Firebase error

#### Scenario: User not found

- **WHEN** a user enters an email that is not registered
- **THEN** the system displays "No account found with this email"
