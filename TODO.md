# Blazing CMS — TODO

## Milestone: Architecture Cleanup ✅

- [x] **Login actually works** — calls `login()` from `useAuth`, shows error toasts, redirects if already authenticated
- [x] **Sign-out button wired** — calls `logout()` from `useAuth` on click
- [x] **Route auth guard** — AppLayout redirects to `/login` if unauthenticated, shows loading state
- [x] **Hardcoded data replaced** — users/roles pages use `useQuery` with `provider.findMany("users")` / `provider.findMany("roles")`
- [x] **All Create buttons wired** — users/new, roles/new call `provider.create()`
- [x] **All Save buttons wired** — users/$id, roles/$id call `provider.update()`, globals/$slug calls `provider.upsertGlobal()`
- [x] **Delete buttons wired** — users/$id has confirmation dialog before deleting
- [x] **Schema-aware entry forms** — `collections/new.$slug.tsx`, `collections/$slug.$id.edit.tsx`, `globals/$slug.tsx` render all fields from schema definitions using `FieldInput`
- [x] **Duplicate routes removed** — `/settings/users`, `/settings/roles`, `/settings/webhooks` deleted, router and settings index updated
- [x] **Collection entries use `admin.useAsTitle`** — reads the configured title field from schema
- [x] **Rich text / markdown / code editors** — Tiptap for rich text, CodeMirror for code, Markdown preview toggle
- [x] **Component and Dynamic Zone field rendering** — resolve sub-fields from schema registry
- [x] **Error boundary on routes** — wraps `RouterProvider` in main.tsx
- [x] **Media upload functional** — file dialog, upload button, grid view with loading/empty states
- [x] **Unused components cleanup** — removed 6 orphaned components
- [x] **Collapsed sidebar tooltips** — `title` attribute on icon-only items
- [x] **Dynamic command palette** — includes collections/globals from schema registry
- [x] **React Query Devtools** — added in dev mode
- [x] **HTML metadata** — favicon, theme-color, description
- [x] **Use `admin.group` for sidebar grouping** — separate nav sections for grouped items
- [x] **Fix generated type names** — `ArrayEntry`, `BooleanEntry`, etc. to avoid global shadowing
- [x] **Schema editor** — editable fields, metadata, and live generated code preview
- [x] **API tokens page** — create, view, revoke, delete tokens
- [x] **Plugins page** — searchable directory, status badges, SDK overview
- [x] **Vite build optimizations** — manualChunks splitting into react-vendor, router, firebase, editors
- [x] **Set up OpenSpec** — installed, configured, wrote initial specs
- [x] **Create initial specs** — auth, schema, content, plugins
- [x] **Remove server backend mode** — `"server"` removed from backend-mode.ts, providers/types.ts, providers/registry.ts
- [x] **Remove server Config fields** — `port`, `host`, `auth.secret`, `auth.expiresIn`, `storage.adapter`, `storage.baseDir`
- [x] **Remove server events** — `server:start`, `server:stop`, `migration:run` from EventMap
- [x] **Remove HTTP server hooks** — from PluginHooks type + plugin-manager.ts
- [x] **Remove server config loading** — core/src/config.ts cleaned, `.env` updated to VITE_ client vars
- [x] **Fix documentation** — README, all docs .md files corrected for client-only architecture
- [x] **Clean up `.fallowrc.json`** — removed dead file references and package names
- [x] **Create `scripts/serve-spa.mjs`** — static file server for e2e tests
- [x] **Rewrite SDK generator** — emits `createBlazeClient`/Firestore client calls
- [x] **Rewrite SDK generator tests** — match new output
- [x] **Delete server packages** — `packages/database/`, `packages/storage/`, `packages/auth/` removed
- [x] **Remove `firebase-admin`** — from root deps and knip ignoreDependencies
- [x] **Fix scaffold template** — removed `status()` import/usage
- [x] **Refactor config.ts** — extracted helpers, reduced cyclomatic complexity
- [x] **Refactor scaffold.ts** — extracted `resolveInput()` and `TEMPLATES`
- [x] **Add `.vitepress/cache/` and `.vitepress/dist/` to gitignore**
- [x] **CI/CD: Docs deployment to GitHub Pages** — `.github/workflows/docs.yml`
- [x] **Fix VitePress socialLinks URL** — `blaze-cms/blaze-cms` → `blazing-cms/blazing-cms`
- [x] **Remove stale `__generated__/sdk.ts`** — was dead code, not imported by anything
- [x] **Fix CLI help text** — removed misleading `firebase-admin` mention
- [x] **Remove stale `DatabaseAdapter` type** — dead interface from deleted server packages
- [x] **Clean up `.env`** — replaced server Admin SDK credentials with VITE_ client SDK vars
- [x] **All turbo tasks pass** — test, typecheck, build
- [x] **Fallow audit passes** — zero issues
- [x] **Schema Writer — Save button writes schema files to disk** — Vite plugin + save button on schema detail page
- [x] **Verify `deploy` command scope** — `packages/cms/src/commands/deploy.ts` runs `firebase deploy --only hosting`. Docs already state "Deploy the admin panel to Firebase Hosting" — correct for static SPA.

---

## Current Milestone: Admin Analytics ✅

- [x] **Data layer** — Firestore composite indexes for time-range queries; analytics type definitions
- [x] **Analytics queries (SDK)** — `getContentCounts()`, `getContentByCollection()`, `getContentChangesOverTime()`, `getStorageUsage()`, `getUserActivity()`
- [x] **Dashboard widgets** — content stats (total collections, entries, globals, media, users)
- [x] **Per-collection chart** — entry counts as bar/pie chart
- [x] **Content changes over time** — line chart with time period selector (7d, 30d, 90d)
- [x] **Storage usage** — total + breakdown by file type
- [x] **User activity** — active users count + top contributors
- [x] **Dedicated analytics page** — full-page view with all widgets
- [x] **SDK config** — enabled flag, caching stale time
- [x] **Tests** — SDK methods + admin UI widget tests

---

## Current Milestone: Media Library ✅

- [x] **Firestore schema + indexes** — folders, tags, metadata model
- [x] **Storage bucket rules** — upload security, file type/max-size enforcement
- [x] **Upload implementation** — `uploadBytesResumable` with progress, drag-drop + click
- [x] **Media CRUD** — list, detail, rename, replace, delete (Storage + Firestore)
- [x] **Folder & tag organization** — Firestore-based folder tree, tags as array
- [x] **Search** — by filename, alt text, caption, tags
- [x] **Usage tracking** — find references across collections
- [x] **Admin UI: media grid/list view** — thumbnail grid + list toggle
- [x] **Admin UI: detail page** — metadata, preview, replace/delete actions
- [x] **Admin UI: folder tree** — sidebar folder navigation
- [x] **Admin UI: media picker** — reusable component for field-level media selection
- [x] **SDK methods** — media CRUD, search, usage queries
- [x] **Tests** — upload, CRUD, search, usage tracking

---

## Current Milestone: RBAC ✅

- [x] **RBAC data models** — roles and user_roles Firestore collections
- [x] **Role CRUD** — create/edit/delete roles with permission flags
- [x] **User-role assignment** — multiple roles per user, merged union
- [x] **Permission cache** — React context, refreshed on auth state change
- [x] **Security Rules enforcement** — deny unauthorized writes (definitive layer)
- [x] **UI-side enforcement** — hide/disable restricted actions
- [x] **Field-level permissions** — read-only or hidden per field group
- [x] **Deny logging** — denied access logged to `access_logs` collection
- [x] **Migration** — existing access control patterns → RBAC
- [x] **SDK methods** — role/user-role CRUD
- [x] **Tests** — RBAC enforcement, Security Rules, UI integration

---

## Current Milestone: Content Versioning ✅

- [x] **Version schema + indexes** — subcollection under each entry/global
- [x] **Pre-update snapshot hook** — save current state as new version before each update
- [x] **Version list** — chronological with metadata (number, author, timestamp, summary)
- [x] **Side-by-side diff** — compare any two versions
- [x] **Single version view** — read-only view of a past version
- [x] **Rollback** — save current as new version, restore target (reversible)
- [x] **Pruning** — count-based (keep last N) + optional age-based TTL
- [x] **Manual deletion** — remove specific versions
- [x] **Admin UI: timeline view** — version history panel on entry detail page
- [x] **Admin UI: diff view** — side-by-side comparison UI
- [x] **Admin UI: rollback dialog** — confirmation with summary
- [x] **Global versioning** — same mechanics for globals
- [x] **SDK methods** — `versions.list()`, `versions.restore()`, `versions.delete()`
- [x] **Tests** — snapshot, rollback, pruning, global versioning

---

## Current Milestone: Content Workflow ✅

- [x] **Workflow state machine schema** — `workflowState` field on entries
- [x] **Workflow config on collection schema** — states, transitions, required roles
- [x] **Default states** — Draft → Review → Published; custom states in config
- [x] **Transition logic** — validate transition is allowed per config
- [x] **Reviewer assignment** — by specific user or by role
- [x] **In-app notifications** — Firestore `notifications` collection listener
- [x] **Audit log** — chronological transitions (from → to, user, timestamp, comment)
- [x] **Admin UI: state indicator** — badge in entry header
- [x] **Admin UI: transition buttons** — Submit for Review, Approve/Publish, Reject, Unpublish
- [x] **Admin UI: reviewer selector** — assign reviewer on submission
- [x] **Admin UI: history panel** — workflow timeline with comments
- [x] **Security Rules** — enforce valid state transitions
- [x] **SDK methods** — transition, assign, history queries
- [x] **Tests** — state machine, enforcement, notifications, audit log

---

## Current Milestone: Admin Promotion via Custom Claims ✅

- [x] **CLI promote command** — `blaze promote <uid-or-email>` sets the `role: "admin"` Firebase custom claim via the Admin SDK (`firebase-admin`, lazily imported)
- [x] **CLI admin check** — `blaze promote <uid-or-email> --check` reports whether the user already has the admin role (exit 0 = admin, 1 = not admin)
- [x] **Client-side claim check** — RBAC context reads ID token claims; users with the admin claim receive super-admin grants
- [x] **Tests** — claim parsing/promotion logic unit tests

---

## Current Milestone: Shared Infrastructure

- [x] **Deploy Firestore indexes + Security Rules** for all new collections/specs
- [x] **Configuration schema entries** — per-capability config in schema system
- [x] **Feature flags** — enable/disable per capability
- [x] **Admin sidebar nav** — updated with new feature links
- [x] **TSDoc documentation** — all new APIs documented
- [x] **E2E tests** — critical paths for each new capability

---

## Current Milestone: Login & Auth Fixes

- [x] **Google sign-in provider** — add `GoogleAuthProvider` + `signInWithPopup` to auth context
- [x] **Login page: Google button** — add "Sign in with Google" button alongside email/password
- [x] **Admin-only route guard** — `AppLayout` checks `role: admin` custom claim (via `getIdTokenResult`), not just auth state; non-admin users redirected to `/login` with an "unauthorized" message
- [x] **Login page: admin claim error** — if user signs in but lacks `role: admin`, show "Access denied" toast and sign out
- [x] **Tests** — auth claim check, Google provider, login guard behavior
- [ ] **Docs: add admin user** — document how to create an admin user (promote CLI, custom claims setup)
