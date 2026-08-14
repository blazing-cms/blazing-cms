# Security

Blazing CMS is client-only, so **Firestore Security Rules are the authoritative
security boundary**. The CLI generates `firestore.rules` from your schemas,
capabilities, workflow config, and RBAC grants. The admin UI only hides
controls; it never authorizes.

## The Grants Model

Access is allow-listed: everything is denied unless a rule explicitly grants it.

- **Grants** are strings like `collections:posts:read`,
  `collections:posts:update`, or `system:manageRoles`.
- The super-admin grant `*:*` matches every permission check.
- Grants are precomputed on a user's `collections_user_roles/{uid}` document from
  their assigned roles, and read inside rules via
  `userGrants()`.

Helper functions generated at the top of every rules file:

```
function isSignedIn() { return request.auth != null; }
function userGrants() {
  return get(/databases/$(database)/documents/collections_user_roles/$(request.auth.uid)).data.grants;
}
function hasGrant(grant) {
  return isSignedIn() && (grant in userGrants() || ("*:*" in userGrants()));
}
function hasSystem(flag) { return hasGrant("system:" + flag); }
```

## Generated Rules per Resource

| Resource                                | Generated rule                                                                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collections_<slug>/{doc}`              | `create`/`read`/`update`/`delete` require the matching `collections:<slug>:<action>` grant.                                                                                        |
| `collections_<slug>/{doc}` (workflow)   | `create` must set `workflowState` to `null` or the default state; `update` must follow an allowed transition (`valid<Slug>Workflow()`).                                            |
| `collections_<slug>/{doc}/versions/{v}` | `read` needs the read grant; `create`/`update`/`delete` need the update grant.                                                                                                     |
| `globals_<slug>/{doc}`                  | `read, write` require `system:manageSettings`.                                                                                                                                     |
| `collections_roles/{doc}`               | `read, write` require `system:manageRoles`.                                                                                                                                        |
| `collections_users/{doc}`               | `read, write` require `system:manageUsers`.                                                                                                                                        |
| `collections_user_roles/{uid}`          | `read` needs `manageUsers` or `manageRoles`; users can create/update their own document only with an empty `roleIds` (for self-onboarding); otherwise `manageUsers`/`manageRoles`. |
| `collections_access_logs/{doc}`         | signed-in users can `create` (denial logging); `read` needs `manageUsers`; `update`/`delete` denied.                                                                               |
| `media`                                 | `read, write` require `system:manageMedia`.                                                                                                                                        |
| `notifications/{doc}`                   | `create` by any signed-in user; `read`/`update` only the owner (`userId == request.auth.uid`); `delete` needs `manageUsers`.                                                       |
| Everything else                         | `allow read, write: if false;` — deny-all catch-all.                                                                                                                               |

## Workflow Enforcement

When a collection has workflow enabled, rules additionally guarantee:

- Creates may only start in the default workflow state.
- Updates must transition along a configured path (the previous state and the
  new state must match one of the schema's `transitions`).

This means a client cannot jump to an arbitrary state even if it bypasses the
admin UI.

## Capability Gating

Rules for a resource are only generated when the corresponding capability is
enabled. For example, with `media.enabled: false` no media rule is emitted and
the deny-all catch-all blocks access. Per-schema `config.features` overrides are
respected (e.g. a collection with `workflow: false` gets plain CRUD rules).

## Best Practices

- **Regenerate and deploy rules with every schema change.** Run
  `blaze generate` and `firebase deploy --only firestore:rules` after modifying
  schemas, workflow configs, or capabilities.
- **Never ship a rules file you hand-edited without re-generating.** The
  generated file is derived from your schema/config; edit the source, not the
  output.
- **Keep Storage locked down.** Storage rules are separate from Firestore rules.
  Restrict `media/` paths to authenticated users.
- **Validate on the server when you can.** Firestore rules express what is
  allowed; they cannot run arbitrary logic. Complex invariants (e.g. cross-doc
  uniqueness) belong in validation enforced by rules `exists()`/`get()`
  checks or a Cloud Function.
- **Run `blaze doctor`** to check project health, and `blaze lint` to catch
  schema issues before deployment.

## Client-Side Safeguards

The SDK and admin also apply their own checks:

- The admin hides or disables actions the current user lacks permission for.
- The SDK throws on writes to disabled capabilities (`CAPABILITY_DISABLED`).
- Denied rule evaluations surface as Firebase permission-denied errors in the UI.

These are conveniences, not security controls — the rules are the boundary.
