# Schema Specification

## Purpose

Provides the schema definition system for the CMS, allowing users to define content models (collections, globals, components) with 30 field types, runtime validation, file-system loading, and hot-reload watching.

## Requirements

### Requirement: Collections define content types

The system SHALL allow defining collections as content types with a slug, labels, fields, and optional configuration for timestamps, auth, admin UI, versions, localization, and slug generation.

#### Scenario: Define a minimal collection

- **WHEN** a user defines a collection with a slug and at least one field
- **THEN** the collection is valid and can be loaded by the schema loader

#### Scenario: Collection with full configuration

- **WHEN** a user defines a collection with timestamps, auth, admin display options, version settings, localization, and slug configuration
- **THEN** all options are stored and available to consumers

#### Scenario: Collection without fields is invalid

- **WHEN** a collection is defined with an empty fields array
- **THEN** the schema validator reports it as invalid

### Requirement: Globals define singleton content

The system SHALL allow defining globals as singleton content records with a slug, label, fields, and optional admin UI configuration.

#### Scenario: Define a global

- **WHEN** a user defines a global with slug "site-settings", label "Site Settings", and a set of fields
- **THEN** the global definition is valid and loadable

### Requirement: Components define reusable field groups

The system SHALL allow defining components as reusable groups of fields that can be referenced from collections and globals.

#### Scenario: Define a component

- **WHEN** a user defines a component with slug "seo", label "SEO", and fields for meta title, description, and image
- **THEN** the component definition is valid and can be referenced by `component` or `dynamicZone` fields

### Requirement: The system supports 30 field types

The system SHALL support 30 field types organized into scalar, code/color, media, selection, relation, and structural categories.

#### Scenario: Scalar field types

- **WHEN** a user creates fields of type `text`, `textarea`, `number`, `boolean`, `date`, `datetime`, `email`, `password`, `url`, `json`, `richText`, or `markdown`
- **THEN** each field is stored with its type identifier and type-specific options

#### Scenario: Code and color fields

- **WHEN** a user creates a `code` field with a language option, or a `color` field with a format option
- **THEN** the options are stored with the field definition

#### Scenario: Media fields

- **WHEN** a user creates a `media` or `upload` field with optional `multiple` and `allowedTypes` options
- **THEN** the options constrain which files can be selected

#### Scenario: Selection fields

- **WHEN** a user creates a `select`, `multiSelect`, `radio`, or `checkbox` field with an options array
- **THEN** the options are stored and validated

#### Scenario: Relation fields

- **WHEN** a user creates a `relation` field targeting a collection slug with a relation kind
- **THEN** the field stores the target collection and relation type

#### Scenario: Component and dynamic zone fields

- **WHEN** a user creates a `component` field referencing a component slug, or a `dynamicZone` field referencing multiple component slugs
- **THEN** the field stores the component references for sub-field resolution

#### Scenario: Structural fields

- **WHEN** a user creates an `array`, `object`, `group`, `repeater`, `tabs`, or `slug` field with nested fields
- **THEN** the field stores its sub-fields for recursive rendering and validation

### Requirement: Field validation rules are configurable

The system SHALL allow configuring validation rules per field: required, unique, min/max values, min/max length, regex pattern, and custom validation functions.

#### Scenario: Configure field validation

- **WHEN** a user sets `validation.required: true` and `validation.maxLength: 100` on a text field
- **THEN** the validation rules are stored with the field definition

#### Scenario: Custom validator

- **WHEN** a user provides a `validation.custom` function
- **THEN** the function is stored and called during entry validation

### Requirement: Schema definitions are loaded from the filesystem at build time

The system SHALL load collection, global, and component definitions from the `cms/{collections,globals,components}/` directory using dynamic imports. This loading happens at build/bundle time — Vite resolves and bundles the schemas into the SPA; it does not require a running server.

#### Scenario: Load all definitions

- **WHEN** the schema loader is invoked during app initialization
- **THEN** it imports `.ts` and `.js` files from the collections, globals, and components subdirectories (bundled by Vite)

#### Scenario: Default schema directory

- **WHEN** no schema directory is specified
- **THEN** the loader defaults to `<cwd>/cms`

#### Scenario: Missing directory returns empty

- **WHEN** a schema subdirectory does not exist
- **THEN** the loader returns an empty array for that type without error

#### Scenario: Multiple definitions per file

- **WHEN** a schema file exports multiple named objects that have a `slug` property
- **THEN** all matching exports are loaded as definitions

#### Scenario: Load errors are non-fatal

- **WHEN** a schema file fails to import
- **THEN** the error is logged and loading continues with remaining files

#### Scenario: Runtime schema source

- **WHEN** the app is running in production
- **THEN** schemas can optionally be read from the `_schemas` Firestore collection for dynamic updates

### Requirement: Schema definitions are validated at load time

The system SHALL validate schema definitions against required fields and type-specific constraints.

#### Scenario: Validate collection slug and labels

- **WHEN** a collection definition is validated
- **THEN** the validator checks that `slug`, `labels.singular`, and `labels.plural` are present

#### Scenario: Validate field properties

- **WHEN** a field definition is validated
- **THEN** the validator checks that `name` is present, and for selection fields that `options` is non-empty

#### Scenario: Validate relation target

- **WHEN** a relation field is validated
- **THEN** the validator checks that `to` (target collection slug) is present

### Requirement: Schema changes are watched in development

The system SHALL support watching schema directories for file changes and notifying consumers via a callback. This is a dev-only feature (Vite's file-watching capabilities); it is not available in production.

#### Scenario: Start watcher

- **WHEN** the schema watcher is started with a directory path
- **THEN** it monitors the collections, globals, and components subdirectories for file changes

#### Scenario: Notify on file add

- **WHEN** a new schema file is created in a watched directory
- **THEN** the watcher calls the registered callback with `"add"` and the file path

#### Scenario: Notify on file change

- **WHEN** an existing schema file is modified
- **THEN** the watcher calls the registered callback with `"change"` and the file path

#### Scenario: Notify on file delete

- **WHEN** a schema file is deleted
- **THEN** the watcher calls the registered callback with `"unlink"` and the file path

#### Scenario: Stop watcher

- **WHEN** the watcher is stopped
- **THEN** all file system watchers are closed

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
