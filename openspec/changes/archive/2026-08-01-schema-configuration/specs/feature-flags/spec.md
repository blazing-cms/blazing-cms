## Purpose

Lets a project enable or disable each CMS capability (analytics, media, versioning, workflow, notifications, RBAC) from schema configuration, with the flag state propagated consistently to code generation, the admin UI, and the generated SDK.

## ADDED Requirements

### Requirement: Capabilities are predefined with default states

The system SHALL recognize a fixed set of capabilities — `content`, `analytics`, `media`, `versioning`, `workflow`, `notifications`, and `rbac` — each with a default enabled state. When a project declares no feature flags, every capability SHALL be enabled.

#### Scenario: All capabilities enabled by default

- **WHEN** a project declares no feature flags
- **THEN** all capabilities are enabled and behave as they do today

### Requirement: Feature flags enable or disable a capability

The system SHALL allow disabling a capability with a project-level feature flag. A disabled capability SHALL be turned off in the generated SDK, hidden in the admin UI, and excluded from emitted Security Rules.

#### Scenario: Disable analytics

- **WHEN** a project sets `capabilities.analytics.enabled: false`
- **THEN** analytics SDK methods return empty/disabled results, the analytics admin route is hidden, and no analytics rules are emitted

#### Scenario: Re-enable a capability

- **WHEN** a project sets the flag back to `true`
- **THEN** the capability is restored across the SDK, the admin UI, and the emitted rules

### Requirement: Collection-scoped capabilities can be overridden per collection

The system SHALL allow per-collection feature flags that override the project-level default for collection-scoped capabilities (`workflow`, `versioning`).

#### Scenario: Versioning disabled for one collection

- **WHEN** a collection sets its versioning flag to disabled while the project has versioning enabled
- **THEN** version history is disabled for that collection only, while other collections keep versioning

### Requirement: Flag state is resolved into generated output

The system SHALL merge project-level and per-collection flag settings and emit the resolved state into the generated app config so the admin UI and SDK read a single source of truth.

#### Scenario: Resolved flags emitted

- **WHEN** `cms generate` runs
- **THEN** the emitted app config contains the effective enabled state for each capability, including per-collection overrides

### Requirement: Invalid feature flags are rejected

The system SHALL reject unknown capability names and non-boolean flag values during schema validation.

#### Scenario: Unknown capability

- **WHEN** a project sets a flag for an unrecognized capability
- **THEN** validation fails with a message naming the unknown capability

#### Scenario: Non-boolean flag value

- **WHEN** a project sets a feature flag to a non-boolean value
- **THEN** validation fails with a message explaining the expected type
