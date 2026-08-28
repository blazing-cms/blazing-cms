# Project Scaffolding Specification

## Purpose

Defines what `@blazing-cms/create-app` writes into a newly generated project,
so every scaffolded app is immediately deployable to Firebase and runnable with
the emulator suite without manual `firebase init`.

## Requirements

### Requirement: Scaffold writes Firebase deployment files

The scaffold SHALL write `firebase.json`, `.firebaserc`, `firestore.rules`,
and `firestore.indexes.json` into the generated project root.

#### Scenario: New project contains Firebase files

- **WHEN** a new project is scaffolded
- **THEN** the project root contains `firebase.json`, `.firebaserc`,
  `firestore.rules`, and `firestore.indexes.json`

#### Scenario: Firebase files are valid starting points

- **WHEN** the scaffolded `firebase.json` and `.firebaserc` are inspected
- **THEN** `firebase.json` configures Firebase Hosting for the admin SPA build
  output and references the Firestore rules and indexes files, and
  `.firebaserc` maps the `default` alias to a project id matching the
  placeholder in `.env`

### Requirement: Rules and indexes are regenerated from the schema

The scaffolded `firestore.rules` and `firestore.indexes.json` are starters;
the system SHALL regenerate them from the schema when `blaze generate` or
`blaze dev` runs.

#### Scenario: Regeneration overwrites scaffolded files

- **WHEN** `blaze generate` runs in a generated project
- **THEN** `firestore.rules` and `firestore.indexes.json` are overwritten with
  output derived from the project's schema definitions

### Requirement: Deploy works without manual Firebase init

A generated project SHALL be deployable with `blaze deploy` and the `deploy`
script without the user first running `firebase init`.

#### Scenario: Deploy after build

- **WHEN** the user runs `blaze deploy` in a generated project
- **THEN** the admin panel builds and Firebase Hosting deployment runs using
  the scaffolded `firebase.json` and `.firebaserc`

### Requirement: Template files ship with the published package

The scaffolded template files SHALL be included in the published
`@blazing-cms/create-app` package so scaffolding works for npm consumers.

#### Scenario: Published package contains templates

- **WHEN** `@blazing-cms/create-app` is installed from the registry and used to
  scaffold a project
- **THEN** all template files (including `AGENTS.md` and the Firebase files)
  are available at runtime and written into the new project
