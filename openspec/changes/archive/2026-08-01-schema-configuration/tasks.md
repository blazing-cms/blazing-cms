## 1. Types (`@blazing-cms/types`)

- [x] 1.1 Add `CapabilityName` (union of the 7 capabilities: content, analytics, media, versioning, workflow, notifications, rbac) and `FeatureFlags` (`Record<CapabilityName, boolean>`)
- [x] 1.2 Add `CapabilitiesConfig` (per-capability `{ enabled?: boolean }` + capability-specific settings like `analytics.staleTimeMs`, `media.maxFileSize`) and `CollectionFeatureFlags` (`Partial<Record<"workflow" | "versioning", boolean>>`)
- [x] 1.3 Extend `CollectionDefinition` with `config?: CollectionCapabilitiesConfig` (per-collection `features` for workflow/versioning)
- [x] 1.4 Extend `GlobalDefinition` with `config?: GlobalCapabilitiesConfig` (per-collection-style `features` for versioning)
- [x] 1.5 Extend `Config` (packages/types/src/core.ts) with `capabilities?: CapabilitiesConfig`

## 2. Schema validation (`@blazing-cms/schema`)

- [x] 2.1 `defineCollection` / `defineGlobal` accept the new `config` field without runtime changes
- [x] 2.2 `SchemaValidator` validates `config`: rejects unknown capability names (in `features`, only workflow/versioning are valid per collection/global), non-boolean flag values, and invalid per-capability settings
- [x] 2.3 Rebuild `@blazing-cms/types` / `@blazing-cms/schema` dist so downstream packages pick up the new types

## 3. CLI config loading (`@blazing-cms/cms`)

- [x] 3.1 Add `jiti` as a direct dependency of `@blazing-cms/cms` (already in lockfile at ^2.7.0) and run pnpm install
- [x] 3.2 Add `loadProjectConfig` in `packages/cms/src/commands/` that jiti-evaluates `blazing-cms.config.ts` and returns the normalized `CapabilitiesConfig` (replaces the regex-based `extractProjectName` read)
- [x] 3.3 `defineConfig` / `BlazeUserConfig` in packages/cms/src/index.ts accept `capabilities` (extends `Config`)
- [x] 3.4 Add `resolveCapabilities` in `packages/cms/src/shared/capabilities.ts` (alias-free, like workflow.ts): merge project config + per-collection config, apply defaults (all capabilities enabled), produce resolved `FeatureFlags`

## 4. Generation (`cms generate`)

- [x] 4.1 Generate emits resolved `capabilities` / `features` into `__generated__/app-config.ts` alongside `projectName`
- [x] 4.2 Gate `firestore.rules` generation on resolved flags (omit rules blocks for disabled capabilities: workflows, versioning, RBAC, media)
- [x] 4.3 Gate `firestore.indexes.json` generation to match enabled capabilities
- [x] 4.4 `cms lint` validates capability config in `blazing-cms.config.ts` and reports invalid flags as errors

## 5. Admin gating (`@blazing-cms/cms` admin)

- [x] 5.1 Admin reads resolved flags from `__generated__/app-config`; sidebar/routes hide disabled capabilities (workflows, analytics, roles)
- [x] 5.2 Versioning toggle and workflow panel honor per-collection `config` (fall back to the project-level flag when unset)
- [x] 5.3 Regenerate the demo app-config so admin compiles against the new exports

## 6. SDK (`@blazing-cms/sdk`)

- [x] 6.1 `BlazeClientConfig` gains `features?: FeatureFlags`; `createBlazeClient` reads it and gates capabilities following the `analytics` precedent (packages/sdk/src/types.ts)
- [x] 6.2 Rebuild `@blazing-cms/sdk` dist so generated clients pick up the new option

## 7. Tests, playground, docs

- [x] 7.1 Unit tests for `resolveCapabilities` (defaults, overrides, unknown capability rejection)
- [x] 7.2 Validator tests for invalid capability names / non-boolean flags
- [x] 7.3 Playground: add `capabilities` to `apps/playground/blazing-cms.config.ts`, disable one capability, regenerate and verify the admin + rules reflect it
- [x] 7.4 Update TODO.md and ARCHITECTURE.md for the schema-configuration / feature-flag capability
- [x] 7.5 Full check: typecheck + lint + `fallow:audit` clean
