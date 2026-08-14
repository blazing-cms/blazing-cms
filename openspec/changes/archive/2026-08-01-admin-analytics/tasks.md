## 1. Data Layer

- [x] 1.1 Add Firestore composite indexes for time-range queries (createdAt, updatedAt on collections_posts, etc.)
- [x] 1.2 Define analytics data shape types in types package

## 2. Analytics Queries (Client SDK)

- [x] 2.1 Implement `analytics.getContentCounts()` — uses `getCountFromServer` per collection for total entries, globals, media, users
- [x] 2.2 Implement `analytics.getContentByCollection()` — queries each collection for entry count
- [x] 2.3 Implement `analytics.getContentChangesOverTime({ period })` — queries entries with `createdAt`/`updatedAt` range filters
- [x] 2.4 Implement `analytics.getStorageUsage()` — sums `size` fields from `media` collection documents, grouped by file type
- [x] 2.5 Implement `analytics.getUserActivity({ period })` — queries distinct `createdBy`/`updatedBy` across collections within a time range, returns active users and top contributors

## 3. Admin UI

- [x] 3.1 Replace static dashboard welcome page with live analytics widgets
- [x] 3.2 Build content statistics widget (total counts, per-collection breakdown with chart)
- [x] 3.3 Build storage usage widget (total storage, file type breakdown)
- [x] 3.4 Build user activity widget (active users, top users table)
- [x] 3.5 Add time period selector (7d, 30d, 90d) that refreshes all widgets
- [x] 3.6 Create dedicated analytics page with expanded views

## 4. SDK & Config

- [x] 4.1 Add SDK methods for analytics queries
- [x] 4.2 Add analytics configuration options (enabled flag, caching stale time)
- [x] 4.3 Write tests for analytics query functions
