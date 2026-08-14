## Context

See `proposal.md` for motivation. The CMS is a client-side-only Firebase app. The admin panel is a React 19 SPA that reads/writes directly to Firestore via the Firebase client SDK. The existing dashboard page shows a static welcome message.

**Key constraint**: No server-side processing, no Cloud Functions, no REST endpoints. All analytics data comes from querying existing Firestore documents directly from the client.

## Goals / Non-Goals

**Goals:**

- Display content statistics on the dashboard (counts per collection, total entries/globals/media/users)
- Display storage usage (total bytes, breakdown by file type)
- Display user activity (active users in period, top contributors)
- Support configurable time periods (7d, 30d, 90d)
- Data sourced exclusively from client-side Firestore queries

**Non-Goals:**

- Operation-level analytics (no middleware/server to log individual operations)
- Real-time analytics (refreshes on page load)
- Export to CSV/PDF
- Third-party analytics integration

## Decisions

### Content statistics: Firestore `getCountFromServer`

- Entry counts use Firestore's `getCountFromServer` aggregation query per collection
- Media and user counts from their respective Firestore collections
- Changes over time: query entries with `createdAt` / `updatedAt` range filters
- **Alternative considered**: Maintaining counter documents — rejected for simplicity; `getCountFromServer` is cost-effective for the admin panel's low-frequency access

### Storage usage: Summation of media document fields

- Storage calculated by reading `size` fields from `media` collection documents
- Breakdown by file type: group media documents by `mimeType` category (image, video, document)
- Query is a simple `getDocs` on `media` with no filters (bounded by pagination)

### User activity: Query-based derivation

- Active users: count distinct `createdBy` / `updatedBy` fields across all collections within the time period
- Top contributors: group by author field, count contributions, sort descending, take top N
- **Alternative considered**: Dedicated activity log collection — rejected as unnecessary without a server to write to it

### Time periods: Client-side date filtering

- Time period selector (7d, 30d, 90d) passed as Firestore range filter on timestamp fields
- All queries are client-side; period selection triggers a TanStack Query refetch

### Data caching

- Analytics data cached with TanStack Query (stale time: 5 minutes)
- Manual refresh button available for on-demand updates

## Risks / Trade-offs

- **Firestore read costs** → Each dashboard view reads counts from multiple collections. Mitigation: TanStack Query caching, manual refresh only.
- **Approximate counts** → `getCountFromServer` may not reflect very recent mutations due to Firestore's aggregation latency. Acceptable for dashboard purposes.
- **Storage query over many media documents** → If media library grows large, reading all document sizes could be slow. Mitigation: pagination, or a summary document updated on media create/delete.

## Migration Plan

1. Add Firestore composite indexes for time-range queries
2. Build analytics query functions in the SDK
3. Build dashboard widgets (content stats, storage, user activity)
4. Build dedicated analytics page with time period selector
5. Add analytics via config toggle
