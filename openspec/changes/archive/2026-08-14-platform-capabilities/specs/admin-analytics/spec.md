## Purpose

Provides dashboard widgets and analytics data to help admins understand content operations, storage usage, and user activity over configurable time periods — all queried directly from Firestore via the client SDK (no server-side aggregation or operation logging).

> ⚠️ **Scope note:** Analytics are derived solely from existing Firestore documents. There is no operation-level logging middleware (no server to log from), so metrics like "API request volume" or "error rate" are not available. See the `admin-analytics` change for a more detailed proposal that aligns with this constraint.

## ADDED Requirements

### Requirement: Dashboard shows content statistics

The system SHALL display content counts and metrics on the admin dashboard using Firestore `getCountFromServer` aggregation queries.

#### Scenario: Total content counts

- **WHEN** an admin views the dashboard
- **THEN** total counts for collections, entries, globals, media assets, and users are displayed

#### Scenario: Content by collection

- **WHEN** an admin views the dashboard
- **THEN** the entry count per collection is shown as a bar or pie chart

#### Scenario: Content changes over time

- **WHEN** an admin selects a time period (7d, 30d, 90d)
- **THEN** the dashboard shows entry creation and update counts over that period as a line chart

### Requirement: Dashboard shows storage usage

The system SHALL display storage consumption metrics for media assets, derived from the `media` collection.

#### Scenario: Total storage used

- **WHEN** an admin views analytics
- **THEN** total storage used by media assets is displayed (sum of `size` fields from `media` documents)

#### Scenario: Storage by file type

- **WHEN** an admin views analytics
- **THEN** storage is broken down by file type (images, videos, documents)

### Requirement: Dashboard shows user activity

The system SHALL display user engagement metrics derived from document authorship fields.

#### Scenario: Active users

- **WHEN** an admin views analytics
- **THEN** the number of active users in the selected period is displayed (distinct `createdBy`/`updatedBy` values)

#### Scenario: Top contributors

- **WHEN** an admin views analytics
- **THEN** the top N users by content contributions are listed with their counts

### Requirement: Analytics data is accessible via SDK

The system SHALL expose analytics query methods in the client SDK.

#### Scenario: Get dashboard summary via SDK

- **WHEN** an SDK consumer calls `analytics.getSummary({ period: "30d" })`
- **THEN** the SDK returns content counts, storage usage, and active user count
