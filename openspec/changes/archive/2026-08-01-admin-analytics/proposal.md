## Why

Admins currently have no visibility into content operations, storage usage, or user activity. Adding dashboard analytics — sourced directly from Firestore via the client SDK — will help them understand how the CMS is being used and monitor trends.

**Architecture constraint:** No server-side processing, no Cloud Functions, no REST endpoints. All analytics data comes from querying existing Firestore documents directly from the client. Operation-level metrics (API request volume, error rates) are not available without a server layer.

## What Changes

- Add dashboard widgets for content statistics (counts per collection, changes over time)
- Add storage usage widget (total storage, breakdown by file type)
- Add user activity widget (active users, most active users)
- All data sourced directly from Firestore via client-side aggregation queries (`getCountFromServer`, document queries)

## Capabilities

### New Capabilities

- `admin-analytics`: Dashboard widgets showing content counts, storage usage, and user activity, queried directly from Firestore via the client SDK

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **packages/cms**: New dashboard UI widgets, new analytics page with time period selector
- **packages/database**: Firestore indexes for efficient aggregation queries
- **packages/types**: Type definitions for analytics data shapes
- **packages/sdk**: New analytics query methods
- Firebase: Firestore composite indexes for count queries
