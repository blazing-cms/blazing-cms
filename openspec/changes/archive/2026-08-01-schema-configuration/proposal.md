## Why

Capabilities (workflow, versioning, analytics, media, notifications, RBAC) are configured ad hoc today: workflow/versioning settings live on collection definitions, analytics/media settings live in the SDK's `BlazeClientConfig`, and there is no way to enable or disable a capability globally. This makes feature availability inconsistent across the admin UI, the generated SDK, and the emitted Security Rules, and forces capabilities into the bundle regardless of whether the project uses them.

## What Changes

- Add a **typed capability configuration** to the schema system: a per-capability config entry (`analytics`, `media`, `versioning`, `workflow`, `notifications`, `rbac`, `content`) that can be set at the project level (`blazing-cms.config.ts`) and per collection/global.
- Add **feature flags**: every capability is enabled/disabled by default and can be toggled at the project level (and per collection for collection-scoped capabilities). Flags propagate consistently to:
  - the **generator** — workflow rules, version subcollection rules, and notifications rules are only emitted when the capability is enabled;
  - the **admin UI** — sidebar links, routes, and panels (workflow panel, version history, analytics widgets, media picker) are gated by flags;
  - the **generated SDK** — capability APIs are disabled at runtime when the flag is off.
- Validate capability config and feature flags in the schema validator; invalid entries fail `cms generate` / `cms lint` with actionable messages.
- Emit the resolved flags/config into the generated `app-config.ts` so admin and SDK read a single source of truth.
- Preserve backward compatibility: existing per-collection `workflow` and `versions` settings keep working and act as collection-level capability config. **BREAKING**: none.

## Capabilities

### New Capabilities

- `feature-flags`: Enable/disable each CMS capability (analytics, media, versioning, workflow, notifications, rbac, content) at the project and per-collection level, with consistent propagation to generation, admin UI, and the generated SDK.

### Modified Capabilities

- `schema`: The schema system gains a per-capability configuration schema — project-level (`blazing-cms.config.ts`), collection-level, and global-level config entries with feature flags, validated by the schema validator.

## Impact

- **packages/types**: New `CapabilitiesConfig` / `FeatureFlags` types; extend `Config`/`BlazeUserConfig`; per-capability config types.
- **packages/schema**: `defineConfig` accepts capabilities; per-collection/global `config` entries; validator rules for feature flags and config entries; config resolution helpers.
- **packages/cms**: `generate` emits gated rules (workflow/versions/notifications) and resolved flags into `app-config.ts`; admin sidebar/routes/panels read flags; `cms lint` reports invalid config.
- **packages/generators**: `SdkGenerator` emits capability-gated SDK APIs; config emission in `app-config`.
- **packages/sdk**: Runtime feature-flag gating in the generated client; `BlazeClientConfig` accepts feature flags.
- **apps/playground**: `blazing-cms.config.ts` declares capabilities; config schema samples in a collection/global.
- **packages/core**: Config loading/merging of capabilities into `Config`.
- Tests: schema validation, generation gating, admin flag propagation, SDK flag gating.
