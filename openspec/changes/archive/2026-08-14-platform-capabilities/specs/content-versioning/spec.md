## Purpose

Provides snapshot-based version history for content entries, enabling users to view changes over time, compare versions, and roll back to previous states with configurable retention policies. All operations are client-side, reading/writing Firestore subcollections directly.

## ADDED Requirements

### Requirement: Content versions are created automatically on updates

The system SHALL save a snapshot of the full document state before applying each update.

#### Scenario: Version created on save

- **WHEN** a user updates and saves a collection entry
- **THEN** a version snapshot is created containing the document state before the update

#### Scenario: Initial version on first create

- **WHEN** a new entry is created
- **THEN** the initial state is saved as version 1

#### Scenario: Version includes metadata

- **WHEN** a version is created
- **THEN** it records: version number, author ID, timestamp, and a brief auto-generated change summary

### Requirement: Users can view version history

The system SHALL display a chronological list of all versions for an entry in the admin UI.

#### Scenario: View version list

- **WHEN** a user opens the version history panel for an entry
- **THEN** a paginated list of versions is displayed (queried from Firestore subcollection) with version number, author, timestamp, and change summary

### Requirement: Users can compare versions

The system SHALL show a diff view between any two versions of an entry.

#### Scenario: Side-by-side diff

- **WHEN** a user selects two versions to compare
- **THEN** the system displays a side-by-side diff highlighting added, removed, and changed fields

#### Scenario: Single version view

- **WHEN** a user clicks on a specific version
- **THEN** the full document state at that version is displayed as read-only

### Requirement: Users can roll back to a previous version

The system SHALL allow restoring an entry to any previous version, creating a new version snapshot of the current state first.

#### Scenario: Rollback creates new version

- **WHEN** a user rolls back to version 3 from version 8
- **THEN** the current state (version 8) is saved as a snapshot, then the document is restored to the version 3 state, creating version 9

#### Scenario: Rollback is reversible

- **WHEN** a user rolls back to an earlier version
- **THEN** the previous state is preserved as a version, allowing them to roll forward again

### Requirement: Version retention is configurable

The system SHALL allow setting retention policies to limit storage growth.

#### Scenario: Retention by count

- **WHEN** `versioning.maxVersions` is set to 50
- **THEN** only the 50 most recent versions are retained; older versions are pruned client-side on each new version creation

#### Scenario: Retention by age

- **WHEN** `versioning.retentionDays` is set to 90
- **THEN** versions older than 90 days are pruned via Firestore TTL policy (platform feature, not a Cloud Function)

#### Scenario: Manual version deletion

- **WHEN** an admin deletes specific versions from the history
- **THEN** those version documents are deleted from the Firestore subcollection

### Requirement: Version history is accessible via SDK

The system SHALL expose version listing and rollback through the client SDK (no API endpoints).

#### Scenario: List versions via SDK

- **WHEN** an SDK consumer calls `collection("posts").versions.list({ entryId })`
- **THEN** the SDK returns a list of version metadata from the Firestore subcollection

#### Scenario: Rollback via SDK

- **WHEN** an SDK consumer calls `collection("posts").versions.restore({ entryId, versionId })`
- **THEN** the current state is saved as a new version, and the entry document is restored to the target version's state

### Requirement: Globals also have version history

The system SHALL apply the same versioning behavior to global content.

#### Scenario: Global version on update

- **WHEN** a global setting is saved
- **THEN** a version snapshot is created for that global
