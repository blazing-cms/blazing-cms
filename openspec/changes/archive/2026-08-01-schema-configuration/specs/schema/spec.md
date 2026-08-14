## ADDED Requirements

### Requirement: Per-capability configuration entries on collections and globals

The system SHALL allow collection and global definitions to declare a `config` block containing capability-specific settings (for example versioning, workflow, analytics, and notifications), stored alongside the existing top-level settings and resolved against project-level defaults.

#### Scenario: Collection with capability config

- **WHEN** a collection declares a `config` block with workflow and versioning entries
- **THEN** the entries are stored with the definition and merged with project-level defaults when resolved

#### Scenario: Global with capability config

- **WHEN** a global declares a `config` block with a versioning entry
- **THEN** the entry is stored with the global definition and available to consumers

#### Scenario: Collection without config

- **WHEN** a collection declares no `config` block
- **THEN** the collection uses the project-level capability defaults

### Requirement: Project-level capability configuration

The system SHALL allow declaring per-capability configuration, including feature flags, in the project config file (`blazing-cms.config.ts`), covering every capability and applying as the default for all collections and globals.

#### Scenario: Project declares capability config

- **WHEN** a project config declares analytics and media configuration
- **THEN** the configuration is loaded and available to generation, the admin UI, and the SDK

#### Scenario: Project declares no capability config

- **WHEN** a project config omits capability configuration
- **THEN** every capability uses its built-in default

### Requirement: Capability configuration is validated

The system SHALL validate capability configuration entries during schema validation, rejecting unknown capability names, invalid settings, and unsupported per-collection capabilities.

#### Scenario: Invalid capability setting

- **WHEN** a collection config contains an unknown or malformed capability setting
- **THEN** validation fails with a message identifying the offending entry
