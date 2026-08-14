## Purpose

Provides dashboard widgets and analytics data to help admins understand content operations, storage usage, and user activity, queried directly from Firestore via the client SDK.

## ADDED Requirements

### Requirement: Dashboard shows content statistics

The system SHALL display content counts and metrics on the admin dashboard using Firestore aggregation queries.

#### Scenario: Total content counts

- **WHEN** an admin views the dashboard
- **THEN** total counts for collections, entries, globals, media assets, and users are displayed

#### Scenario: Content by collection

- **WHEN** an admin views the dashboard
- **THEN** the entry count per collection is shown as a bar or pie chart

#### Scenario: Content changes over time

- **WHEN** an admin selects a time period (7d, 30d, 90d)
- **THEN** the dashboard shows entry creation counts over that period as a line chart

### Requirement: Dashboard shows storage usage

The system SHALL display storage consumption metrics for media assets, derived from the `media` collection.

#### Scenario: Total storage used

- **WHEN** an admin views analytics
- **THEN** total storage used by media assets is displayed

#### Scenario: Storage by file type

- **WHEN** an admin views analytics
- **THEN** storage is broken down by file type (images, videos, documents)

### Requirement: Dashboard shows user activity

The system SHALL display user engagement metrics derived from document authorship fields.

#### Scenario: Active users

- **WHEN** an admin views analytics
- **THEN** the number of active users in the selected period is displayed

#### Scenario: Top contributors

- **WHEN** an admin views analytics
- **THEN** the top N users by content contributions are listed with their counts

### Requirement: Analytics data is accessible via SDK

The system SHALL expose analytics query methods in the client SDK.

#### Scenario: Get dashboard summary via SDK

- **WHEN** an SDK consumer calls `analytics.getSummary({ period: "30d" })`
- **THEN** the SDK returns content counts, storage usage, and active user count
