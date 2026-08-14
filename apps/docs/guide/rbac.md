# Role-Based Access Control (RBAC)

RBAC controls access to collections, globals, admin actions, and data operations
through configurable roles and permission flags. Enforcement happens at two
layers:

1. **Firestore Security Rules** — the definitive, server-side layer
2. **Admin UI** — hides or disables actions the current user cannot perform

## How It Works

- **Roles** are stored in the `roles` Firestore collection. Each role is a set of
  permission flags per collection (`create`, `read`, `update`, `delete`,
  `publish`) plus system actions (`manageUsers`, `manageRoles`, `manageMedia`,
  `manageSettings`, `superAdmin`).
- **User-role assignments** are stored in the `user_roles` subcollection under
  each user. A user can have multiple roles; effective permissions are the union
  of all assigned roles.
- **Grants** are precomputed into an array on the assignment document
  (`collections:<slug>:<action>`, `collections:*:<action>`, `*:*`) so Security
  Rules can check them with `hasGrant(...)`.

Permissions use an **allow-list** strategy: access is denied by default and only
granted when explicitly allowed.

## Creating Roles

In the admin panel, **Roles** → **New Role**:

- Name and optional description
- Per-collection CRUD toggles for each collection
- System permission toggles
- Save writes the role to Firestore

## Assigning Roles

In **Users**, open a user and assign one or more roles. The effective permissions
are the union of every assigned role. Removing a role deletes its assignment.

## Enforcement

- **Writes** — Firestore Security Rules call `hasGrant("collections:posts:update")`
  before allowing the write; unauthorized writes are rejected with
  permission-denied.
- **UI** — the admin reads the user's grants into a React context
  (`usePermissions().can(action, resource)`) and hides or disables restricted
  actions (e.g. the Delete button is not rendered without delete permission).
- **Field-level** — fields with `admin.permissions` can be made read-only or
  hidden for users without the matching permission.
- **Deny logging** — denied actions are appended to the `access_logs` collection
  with user id, resource, action, and timestamp.

## Bootstrapping

If the roles store is empty (a fresh install), the signed-in user is
automatically granted the super-admin grant (`*:*`) so the app is usable until
roles are created.

## SDK Usage

```ts
import { createBlazeClient } from "@blazing-cms/sdk";

const client = createBlazeClient({/* firebase config */});

// Roles
const roles = await client.rbac.listRoles();
const role = await client.rbac.getRole(roleId);
await client.rbac.createRole({
  name: "Editor",
  permissions: {
    collections: { posts: { create: true, read: true, update: true } },
    system: { manageMedia: true },
  },
});
await client.rbac.updateRole(roleId, { description: "Edits posts" });
await client.rbac.deleteRole(roleId);

// Assignments
const assignment = await client.rbac.getUserRoles(uid);
await client.rbac.assignRoles(uid, ["role-editor", "role-moderator"]);
```

## Data Model

| Firestore path                 | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `collections_roles/{id}`       | Role definitions with permission flags.              |
| `collections_user_roles/{uid}` | User → role mappings and precomputed `grants` array. |
| `collections_access_logs/{id}` | Denied-access audit entries.                         |

## Disabling RBAC

When `rbac` is disabled, the admin hides the Users/Roles nav and the SDK's
`client.rbac` reads return empty results while writes throw `CAPABILITY_DISABLED`.
