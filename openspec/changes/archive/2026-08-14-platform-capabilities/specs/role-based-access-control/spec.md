## Purpose

Provides a flexible role-based permission system that controls access to collections, globals, admin actions, and data operations. Enforcement is at two layers: Firestore Security Rules (definitive, server-side) and admin UI (convenience, client-side).

## ADDED Requirements

### Requirement: Admins can define roles with granular permissions

The system SHALL allow defining custom roles composed of individual permission flags.

#### Scenario: Create a custom role

- **WHEN** an admin creates a role named "Editor" with permissions `collections.posts.read` and `collections.posts.write`
- **THEN** the role document is saved to the `roles` Firestore collection

#### Scenario: Role includes all standard permission categories

- **WHEN** creating or editing a role
- **THEN** the admin can toggle permissions for: collections (CRUD per collection), globals, media, users, settings, schema, and admin panel access

### Requirement: Users can be assigned one or more roles

The system SHALL allow assigning roles to users, with role resolution merging permissions from all assigned roles.

#### Scenario: Assign role to user

- **WHEN** an admin assigns the "Editor" role to user@example.com
- **THEN** a document is written to the `user_roles` subcollection under the user's document

#### Scenario: Multiple roles merge

- **WHEN** a user has both "Editor" and "Moderator" roles
- **THEN** the effective permissions are the union of both roles (merged client-side from Firestore reads)

#### Scenario: Remove role from user

- **WHEN** an admin removes a role from a user
- **THEN** the user_roles subcollection document is deleted

### Requirement: Permission checks are enforced at Security Rules and UI levels

The system SHALL enforce permissions via Firestore Security Rules on every read/write, and hide unauthorized UI elements in the admin panel.

#### Scenario: Security Rules reject unauthorized write

- **WHEN** a user without `collections.posts.write` permission attempts to write to `collections_posts`
- **THEN** Firestore Security Rules deny the write with a permission-denied error

#### Scenario: UI hides restricted actions

- **WHEN** a user without delete permission views a collection entry
- **THEN** the "Delete" button is not rendered

#### Scenario: UI disables restricted fields

- **WHEN** a user without `collections.posts.fields.seo` reads a post
- **THEN** the SEO field group is visible but read-only

#### Scenario: Permission cache in React context

- **WHEN** the app initializes or auth state changes
- **THEN** the user's roles and effective permissions are loaded from Firestore and cached in a React context

### Requirement: Permission checks use an allow-list strategy

The system SHALL default to denying all access and only grant permissions that are explicitly allowed.

#### Scenario: New collection is inaccessible to non-admin roles by default

- **WHEN** a new collection "analytics" is created
- **THEN** Firestore Security Rules and client permission cache deny access to non-admin roles

### Requirement: Permission changes take effect without re-authentication

The system SHALL evaluate permissions on each operation.

#### Scenario: Immediate enforcement

- **WHEN** an admin revokes a user's `collections.posts.write` permission
- **THEN** the user's next write request to posts is denied by Firestore Security Rules; the client-side cache invalidates on the next permission check

### Requirement: Role management is available via the client SDK

The system SHALL expose CRUD operations for roles and user-role assignments through the client SDK.

#### Scenario: List all roles

- **WHEN** an admin queries all roles
- **THEN** the SDK reads the `roles` Firestore collection and returns all role documents

#### Scenario: Get user roles

- **WHEN** an admin queries roles for a user
- **THEN** the SDK reads the user's `user_roles` subcollection and returns assigned roles and effective permissions

### Requirement: Denied access attempts are logged

The system SHALL log denied requests for audit purposes.

#### Scenario: Log denied access

- **WHEN** a Security Rules write is denied (or a UI action is blocked)
- **THEN** the event is logged to a Firestore `access_logs` collection with user ID, resource, action, and timestamp
