## Context

See proposal.md — Why. Current state that shapes the approach:

- Collection/global definitions already carry ad-hoc capability settings: `workflow` and `versions` on collections, `versions` on globals (`packages/types/src/schema.ts`).
- The SDK already seeds per-capability config: `BlazeClientConfig.analytics` with an `enabled` flag (`packages/sdk/src/types.ts`).
- Project config is thin: `Config` (`packages/types/src/core.ts`) and `BlazeUserConfig` (`packages/cms/src/index.ts`) hold only `firebase`, `storage`, `plugins`, `projectName`.
- Generation is centralized in `packages/cms/src/commands/generate.ts` — it emits the schema registry, `app-config.ts`, `firestore.rules`, and `firestore.indexes.json`, and runs `TypeGenerator` / `ValidationGenerator` / `SdkGenerator`.
- The admin reads generated output (`__generated__/schema-registry.ts`, `app-config.ts`); capability UI (workflow panel, version panel, analytics widgets) is always present.

## Goals / Non-Goals

**Goals:**

- One typed surface for per-capability configuration (project + collection/global level) with feature flags.
- Consistent flag propagation to generation (rules), admin UI (nav/routes/panels), and the generated SDK.
- Fully backward compatible: no capability changes behavior unless a flag is explicitly turned off.

**Non-Goals:**

- Adding new runtime capability behavior beyond gating (this change wires config + flags, not new features).
- Firestore-based dynamic flags: flags must be known at build time because they gate code generation and rules emission.
- Replacing the existing top-level `workflow` / `versions` settings; they continue to define capability _settings_, the new config only controls _enabled state_.

## Decisions

### D1: Flags live in schema config, not Firestore

Capabilities are toggled in `blazing-cms.config.ts` and schema definitions, resolved at build time, and emitted into generated output. Runtime Firestore flags were considered and rejected: rules emission, type generation, and bundled admin routes all happen at build time, so a runtime source would fragment the single source of truth.

### D2: One `capabilities` block + per-collection `config.features`

Project config gains a single `capabilities` key (per-capability `{ enabled?: boolean }` plus capability-specific options such as `analytics.staleTimeMs` and `media.maxFileSize`). Collections/globals gain a `config` block whose `features` sub-key holds collection-scoped flags. Scattering top-level keys was rejected because it multiplies validation and resolution paths.

### D3: Defaults are enabled (opt-out model)

Every capability defaults to enabled, preserving today's behavior exactly. A capability only turns off when a project explicitly disables it. This keeps the change additive and safe.

### D4: Only `workflow` and `versioning` are collection-scoped

These are the capabilities that genuinely vary per content type. Analytics, media, notifications, RBAC, and content are project-wide; the validator rejects per-collection flags for them.

### D5: Resolved state is emitted into `app-config.ts`

A pure `resolveCapabilities(project, defs)` function merges project defaults with per-collection overrides. `cms generate` writes the result into `app-config.ts`, and both the admin UI and the generated SDK consume it — one resolved source of truth instead of re-deriving in each consumer.

### D6: SDK gating follows the analytics precedent

The SDK already returns empty/disabled results when `config.analytics.enabled === false`. That pattern generalizes to every capability via `BlazeClientConfig.features`: disabled capabilities keep their API surface but no-op, so downstream code never crashes.

## Risks / Trade-offs

- [Capability settings drift from flags] → One `resolveCapabilities` function is the only resolver; unit tests assert merged results.
- [Rules emission accidentally drops rules for default-on capabilities] → Explicit generation tests assert rules for each capability with defaults on and off.
- [Admin gating hides content by mistake] → Gating is hide-when-explicitly-disabled; default state always shows the UI. Routes render a no-access state rather than 404ing.
- [Broadening `CollectionDefinition` breaks existing schema tests] → New `config` fields are optional; existing definitions and tests are untouched.
- [SDK no-op APIs hide misuse] → Disabled APIs log a warning once and return typed empty results (documented in generated output).

## Migration Plan

None required. The change is additive: project config, schema definitions, generated output, and SDK config all accept the new optional shape, and defaults preserve current behavior. Rollback is a revert; feature flags are declarative config, not data migrations.

## Open Questions

None — decisions above fully determine the specs, approach, and task breakdown.
