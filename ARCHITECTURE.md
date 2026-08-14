# ARCHITECTURE.md

Blazing CMS — architecture overview.

## 1. Overview

Blazing CMS is a **client-only, schema-driven headless CMS** built on Google Firebase. There is no application server: Firebase Auth, Firestore, Storage, and Hosting are the entire backend. Content models (collections, globals, components) are declared as TypeScript code, and a code generator turns those declarations into TypeScript types, a schema registry that drives the admin panel, Firestore Security Rules + indexes, and a typed SDK for consumer apps.

The project is a **pnpm monorepo** orchestrated with **Turborepo**. It ships two runnable things:

1. **The admin panel** — a React SPA (Vite) served as a static site, deployed to Firebase Hosting.
2. **The CLI** (`@blazing-cms/cms`) — `dev`, `build`, `deploy`, `generate`, `scaffold`, `lint`, `doctor` commands that operate on a user project's schema directory (`cms/`).

## 2. High-level flow

```
┌─────────────────────┐    cms/ collections, globals, components
│  Schema definitions │    apps/playground/cms/*.ts  (defineCollection, defineGlobal, …)
└──────────┬──────────┘
           │  cms generate  (or cms dev, which generates on start)
           ▼
┌──────────────────────┐
│   Generation pipeline│  packages/cms/src/commands/generate.ts
│   ─ per collection:  │  ─ TypeGenerator, ValidationGenerator, SdkGenerator (packages/generators)
│   - schema-registry  │  ─ schema-registry.ts, types.ts, validation.ts, app-config.ts  → packages/cms/src/admin/__generated__
│   - Firestore rules  │  ─ firestore.rules (RBAC + workflow + versions), firestore.indexes.json, storage.rules
│   - typed SDK        │  ─ createBlazeClient() for the consumer app
└──────────┬──────────┘
           ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Admin panel │      │  Firebase    │      │  Consumer    │
│  (React SPA) │◄────►│  (the only   │◄────►│  app using   │
│              │      │   backend)   │      │  the SDK     │
└──────────────┘      └──────────────┘      └──────────────┘
```

## 3. Monorepo layout

| Package                    | Path                   | Responsibility                                                                                                                                                    |
| -------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@blazing-cms/types`       | `packages/types`       | Shared type contracts: field definitions, schema definitions, core config, plugin hooks.                                                                          |
| `@blazing-cms/schema`      | `packages/schema`      | Schema DSL (`defineCollection`, `defineGlobal`, `defineComponent`, field builders like `text`, `boolean`, `array`, `relation`…), loader, validator, file watcher. |
| `@blazing-cms/validation`  | `packages/validation`  | Zod schema generation for content validation.                                                                                                                     |
| `@blazing-cms/generators`  | `packages/generators`  | Code generation pipeline: `TypeGenerator`, `ValidationGenerator`, `SdkGenerator`.                                                                                 |
| `@blazing-cms/sdk`         | `packages/sdk`         | Runtime SDK for building content frontends: collection, global, media, versions, workflow, notifications, analytics, RBAC, auth.                                  |
| `@blazing-cms/cms`         | `packages/cms`         | The CLI + the admin panel SPA + the shared workflow state machine.                                                                                                |
| `@blazing-cms/core`        | `packages/core`        | Framework bootstrap primitives: config loading, DI container, event bus, lifecycle, logger.                                                                       |
| `@blazing-cms/permissions` | `packages/permissions` | Access-control definitions shared between admin and SDK.                                                                                                          |
| `@blazing-cms/plugins`     | `packages/plugins`     | Plugin discovery + plugin manager (plugin contract defined in `types`).                                                                                           |
| `@blazing-cms/create-app`  | `packages/create-app`  | Scaffolding templates for new projects.                                                                                                                           |
| `apps/playground`          | `apps/playground`      | Reference project: schema files, generated `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `blazing-cms.config.ts`.                                 |
| `apps/docs`                | `apps/docs`            | VitePress documentation site.                                                                                                                                     |

All published packages resolve via `dist` — run `pnpm build` (or typecheck) after changing types so downstream packages pick up the new `dist` output.

## 4. Design principles

- **Client-only.** No app server. Anything requiring a server (webhooks, server-side rate limiting) is deliberately out of scope.
- **Schema-driven.** Content models live in code, not in a database UI. The generator is the single source of truth for types, validation, rules, and SDK.
- **Firebase-native.** Firestore Security Rules are the _definitive_ authorization layer; the admin UI only mirrors those rules for UX.
- **Generated code is disposable.** Everything under `packages/cms/src/admin/__generated__` is regenerated; never hand-edit it.

## 5. The schema system

Schema files live under a project's `cms/` directory (`apps/playground/cms`), e.g. `collections/array.ts`, `globals/site.ts`, `components/seo.ts`. Field builders come from `@blazing-cms/schema`. A schema definition includes field-level metadata (labels, validation, admin placeholder) and feature config — e.g. a collection can declare a content-workflow config with `states`, `transitions`, and required roles.

The `SchemaLoader` (`packages/schema/src/loader.ts`) resolves the raw user files, the validator checks them, and the watcher enables hot reload during `cms dev`.

## 6. The generation pipeline

`packages/cms/src/commands/generate.ts` is the orchestrator. It:

1. Loads and validates schema definitions from `cms/`.
2. Resolves capability feature flags from `blazing-cms.config.ts` merged with per-definition `config.features`.
3. Runs the `GenerationPipeline` (`packages/generators`) with `TypeGenerator`, `ValidationGenerator`, and `SdkGenerator`.
4. Writes the admin registry — `schema-registry.ts` (`collections` / `globals` / `components` arrays + lookup helpers), `types.ts`, `validation.ts`, `app-config.ts` (project name + resolved `capabilities`) — into `packages/cms/src/admin/__generated__`.
5. Emits `firestore.rules` and `firestore.indexes.json` at the project root, gated on the resolved flags.
6. Emits the typed SDK (`createBlazeClient`, including resolved `features`) for the consumer app.

### Security Rules generation

Rules are derived per collection:

- **RBAC grants** — `hasGrant("collections:<slug>:<action>")` with `collections:*:<action>` wildcard and `*:*` super-admin, read from `collections_user_roles/<uid>.grants`.
- **Workflow enforcement** — collections with a workflow get a `valid<Name>Workflow()` helper restricting state changes to the configured transitions; creation is restricted to the default state.
- **Version subcollections** — `collections_<slug>/{doc}/versions/{version}` are readable by users with read grant and writable by users with update grant.
- **Platform collections** — roles, users, user_roles, media, access logs, notifications get system-flag rules (`manageRoles`, `manageUsers`, `manageMedia`, …).
- **Capability gating** — rule sections are omitted when the corresponding capability is disabled (e.g. workflow helpers and version subcollections per collection, media, RBAC platform collections, notifications).
- **Deny-all fallback** — `match /{document=**}` denies everything not matched above.

## 7. Admin panel architecture

The admin is a self-contained Vite app rooted at `packages/cms/src/admin`. Stack: React, TypeScript, Vite, Tailwind CSS v4 (`@theme inline` variables), shadcn-style UI components, TanStack Router (hand-written route tree in `router.tsx`), TanStack Query for data fetching.

### Key layers

- **Entry point** — `main.tsx` composes providers: `QueryClientProvider`, `ThemeProvider`, `AuthProvider` (Firebase Auth), `DataProviderWrapper`, `RbacProvider`, `ToastProvider`, `ErrorBoundary`, then `RouterProvider`.
- **Data providers** — a `DataProvider` interface (`lib/providers/types.ts`) with a Firebase implementation and an in-memory mock. Selected by `VITE_BACKEND_MODE` via `lib/providers/registry.ts`; accessed through `useDataProvider()`. Backed by the Firestore model: `collections_<slug>`, `globals_<slug>` (with `value` doc), plus versions subcollections.
- **RBAC** — `RbacProvider` loads roles + user roles and computes grants. `usePermissions().can(action, resource)` gates nav and actions. If the roles store is empty (fresh install), the signed-in user is bootstrapped with the super-admin grant so the app is usable until roles are created.
- **Routing** — routes: `/`, `/analytics`, `/collections`, `/collections/$slug`, `/collections/new/$slug`, `/collections/$slug/$id` (editor), `/collections/$slug/$id/revisions`, `/globals/$slug`, `/globals/$slug/revisions`, `/media`, `/users`, `/roles`, `/schemas`, `/settings`, `/login`. The entry editor renders schema-driven forms via `FieldInput`.
- **Feature components** — `version-panel.tsx` / `version-diff.tsx` (version history + diff, now on dedicated `/revisions` routes), `workflow-panel.tsx` (state transitions, reviewer assignment), `notification-bell.tsx`, `media-picker.tsx`, analytics widgets, `command-palette.tsx`, schema editor.

The CLI `dev`/`build` commands run Vite against this app (`vite.config.ts` includes the `schemaWriterPlugin`, which writes schema files to disk when the schema editor saves).

## 8. Data model (Firestore)

| Path                                           | Purpose                                                      |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `collections_<slug>/{id}`                      | Entry documents for each collection.                         |
| `collections_<slug>/{id}/versions/{versionId}` | Content version snapshots (number, author, timestamp, data). |
| `globals_<slug>/value`                         | Global content value document.                               |
| `globals_<slug>/value/versions/{versionId}`    | Global version snapshots.                                    |
| `collections_roles/{id}`                       | Role definitions with permission flags.                      |
| `collections_users/{id}`                       | User records.                                                |
| `collections_user_roles/{uid}`                 | User → role mappings and effective `grants` array.           |
| `media/{id}`                                   | Media metadata; binaries live in Firebase Storage.           |
| `notifications/{id}`                           | Per-user in-app notifications.                               |
| `collections_access_logs/{id}`                 | Denied-access audit entries.                                 |

## 9. Capabilities

- **Content versioning** — snapshot before each update; list, single-view, side-by-side diff, reversible rollback, count-based pruning, manual deletion. Enforced at the provider level and mirrored in rules (version subcollections).
- **Content workflow** — a shared state machine (`packages/cms/src/shared/workflow.ts`) with a default Draft → Review → Published lifecycle (configurable per collection). Transitions are validated client-side and enforced in Security Rules; transitions emit audit history and notifications.
- **Media library** — upload with resumable progress, folders/tags, search, usage tracking, picker component.
- **RBAC** — role CRUD, multi-role user assignment (merged union), field-level read/write permissions, deny logging.
- **Analytics** — content counts, per-collection charts, content-change-over-time, storage usage, user activity.
- **Notifications** — Firestore listener delivering workflow / system notifications to users.

Every capability has a feature flag (`content`, `analytics`, `media`, `versioning`, `workflow`, `notifications`, `rbac`). Flags are configured in `blazing-cms.config.ts` (`capabilities.<name>.enabled`) and overridable per collection/global via `config.features` on schema definitions (only `workflow`/`versioning` are collection-scoped, `versioning` global-scoped). `cms generate` resolves the merged flags (`packages/cms/src/shared/capabilities.ts`) into `__generated__/app-config.ts`; generation gates Firestore rules blocks, the admin hides disabled capabilities (nav, routes, panels), and the generated SDK reports `features` to `createBlazeClient`, which gates reads (empty results + warn) and writes (`CAPABILITY_DISABLED`).

## 10. SDK

`packages/sdk` exposes a Firebase-Firestore-backed client for consumer apps: collection CRUD, globals, media, version history, workflow transitions, notifications, analytics queries, RBAC (roles/user-roles), and auth. It resolves through `@blazing-cms/types` / `@blazing-cms/schema` `dist` output (rebuild those packages after type changes). It accepts `features?: FeatureFlags` (typically sourced from the generated SDK) to disable capability surface when the corresponding flag is off.

## 11. Tooling & quality gates

- **Node ≥ 22**, `pnpm@11`, **Turbo** for task orchestration (`build`, `dev`, `lint`, `typecheck`, `test`, `docs:*`).
- **ESLint 10** with type-aware `typescript-eslint` rules (unsafe assignments/calls, floating promises, etc.) plus security, secrets, and unsanitized plugins; **Prettier** for formatting.
- **Husky + lint-staged** (eslint `--fix` + prettier on commit), **commitlint** for message convention.
- **Vitest** unit tests (workspace-wide), **Playwright** e2e (`e2e/admin-panel.spec.ts`), `@vitest/coverage-v8`.
- **Fallow** — complexity / duplicate-block / anti-pattern audit (a pre-push gate; repo convention is to add threshold overrides in `.fallowrc.json` for legitimately complex files).
- **Knip** — dead-code detection.
- **Changesets** for versioning/publishing; **GitHub Actions**: `ci.yml` (test/typecheck/lint), `docs.yml` (VitePress → GitHub Pages), `publish.yml` (npm).

## 12. Deployment

`cms deploy` builds the admin SPA and runs `firebase deploy --only hosting`. Firestore rules, storage rules, and indexes (generated by `cms generate`) are deployed with the Firebase CLI against the target project (e.g. the playground uses the `arche-cms-demo` project; keys live in the project `.env` as `VITE_*` client vars).
