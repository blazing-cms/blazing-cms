## MODIFIED Requirements

### Requirement: Admin user proceeds after login

The system SHALL allow a user with the `role: admin` custom claim on their refreshed ID token to enter the CMS dashboard after signing in, without being signed out.

#### Scenario: Admin user proceeds after login

- **WHEN** a user signs in (via email/password or Google) and has the `role: admin` custom claim on their refreshed ID token
- **THEN** the system recognizes the admin from a fresh, force-refreshed ID token, navigates to the dashboard, and keeps the user signed in

### Requirement: Non-admin user denied after login

The system SHALL enforce admin-only access at the point of login, based on a fresh, force-refreshed ID token. If a user authenticates successfully but does not have the `role: admin` custom claim, the system SHALL sign them out and display an access-denied message. The decision SHALL be made only after the ID-token claim check has completed.

#### Scenario: Admin user proceeds after login

- **WHEN** a user signs in (via email/password or Google) and has the `role: admin` custom claim on their refreshed ID token
- **THEN** the system navigates to the dashboard and keeps the user signed in

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
