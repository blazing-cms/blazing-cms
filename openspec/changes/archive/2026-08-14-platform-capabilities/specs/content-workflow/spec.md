## Purpose

Enables controlled content publishing through multi-stage workflows with draft, review, and published states, including reviewer assignment, in-app notifications, and approval gates enforced via Firestore Security Rules and the admin UI.

## ADDED Requirements

### Requirement: Content entries have workflow states

The system SHALL support configurable workflow states for collection entries, defaulting to Draft → Review → Published.

#### Scenario: Default workflow states

- **WHEN** a new collection is created
- **THEN** it supports the default states: Draft, Review, Published

#### Scenario: Custom workflow states

- **WHEN** an admin configures workflow states for a collection
- **THEN** the entry state machine uses the custom states and transitions

#### Scenario: Workflow state shown in entry header

- **WHEN** a user opens an entry in the admin UI
- **THEN** the current workflow state and available transitions are displayed in the header

### Requirement: Users can transition entries between states

The system SHALL allow authorized users to move entries through workflow states according to configured transitions.

#### Scenario: Submit for review

- **WHEN** an author clicks "Submit for Review" on a draft entry
- **THEN** the entry transitions from Draft to Review state (Firestore document updated)

#### Scenario: Approve and publish

- **WHEN** a reviewer clicks "Approve" on an entry in Review state
- **THEN** the entry transitions from Review to Published

#### Scenario: Reject and return to draft

- **WHEN** a reviewer clicks "Reject" on an entry in Review state
- **THEN** the entry transitions back to Draft with an optional rejection reason

#### Scenario: Unpublish

- **WHEN** an editor clicks "Unpublish" on a published entry
- **THEN** the entry transitions from Published back to Draft

### Requirement: Workflow transitions can require approval

The system SHALL support requiring a specific user or role to approve transitions to certain states.

#### Scenario: Require role for publish

- **WHEN** a workflow is configured requiring "Editor" role to approve the Draft → Review transition
- **THEN** Firestore Security Rules check the user's role before allowing the state transition write

### Requirement: Reviewers can be assigned

The system SHALL allow assigning specific users as reviewers for a transition.

#### Scenario: Assign reviewer

- **WHEN** an author submits for review and selects user@example.com as the reviewer
- **THEN** user@example.com is notified via in-app notification and can approve or reject the entry

#### Scenario: Assign reviewer by role

- **WHEN** a workflow transition requires any user with the "Editor" role
- **THEN** all users with that role can approve the transition

### Requirement: Notifications are sent on state changes

The system SHALL notify relevant users when a workflow transition occurs via in-app notifications only (no email — email requires a server component).

#### Scenario: Author notified on approval

- **WHEN** a reviewer approves an entry for publication
- **THEN** the author receives an in-app notification (Firestore `notifications` collection, observed via client listener)

#### Scenario: Reviewer notified on submission

- **WHEN** an author submits an entry for review
- **THEN** the assigned reviewer receives an in-app notification

#### Scenario: Rejection notification

- **WHEN** a reviewer rejects an entry
- **THEN** the author receives an in-app notification with the rejection reason

### Requirement: Workflow history is tracked

The system SHALL maintain an audit log of all workflow transitions for each entry.

#### Scenario: View workflow history

- **WHEN** a user opens the workflow history panel for an entry
- **THEN** a chronological list of all state transitions is displayed (read from Firestore subcollection) with: from state, to state, user, timestamp, and optional comment
