## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Non-admin users are signed out on login

The system SHALL enforce admin-only access at the point of login. If a user authenticates successfully but does not have the `role: admin` custom claim, the system SHALL sign them out and display an access-denied message.

#### Scenario: Non-admin user denied after login

- **WHEN** a user signs in (via email/password or Google) but does not have the `role: admin` custom claim
- **THEN** the system displays an "Access denied — admin access required" toast, signs the user out, and remains on the login page

#### Scenario: Admin user proceeds after login

- **WHEN** a user signs in and has the `role: admin` custom claim
- **THEN** the system navigates to the dashboard
