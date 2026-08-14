## Context

See `proposal.md` for motivation. The CMS uses Firebase client SDK exclusively — the admin panel is a React 19 SPA that talks directly to Firestore, Firebase Auth, and Firebase Storage. No REST API layer, no Express server, no Cloud Functions. All enforcement is at the Firestore level (Security Rules) or the client level (UI rendering).

Key architectural constraints:

- Firebase as backend, accessed exclusively via client SDKs
- Admin UI is a React 19 SPA with TanStack Query for Firestore data
- All data in Firestore, all files in Firebase Storage
- Security enforced via Firestore Security Rules and client-side UI

## Goals / Non-Goals

**Goals:**

- Define Firestore data models, Security Rules, and admin UI patterns for all 5 capabilities
- Reuse existing client SDK patterns
- Minimize Firestore read/write costs
- All capabilities accessible via admin UI and generated SDK

**Non-Goals:**

- Server-side processing or REST API endpoints
- Cloud Functions or backend services
- Real-time analytics or collaboration
- Migration of existing content

## Decisions

### Cross-cutting: Firestore data model patterns

All new capabilities use Firestore collection-per-entity and subcollection patterns. The admin panel uses TanStack Query for data fetching with Firestore as the direct data source.

### Media Library: Firebase Storage + Firestore metadata

- Files uploaded directly to Firebase Storage via client SDK (`uploadBytesResumable`)
- Metadata in Firestore `media` collection with storage path references
- Image previews via Firebase Storage download URLs
- Organization via Firestore queries (folders as documents, tags as array fields)
- **Client-side only**: no server-side image transformation; upload pre-transformed variants if needed

### RBAC: Firestore Security Rules + UI enforcement

- Roles stored in `roles` collection with permission map
- User-role assignments in `user_roles` subcollection under each user
- Firestore Security Rules check custom claims or read from `user_roles` at query time
- Admin UI conditionally renders/hides elements based on the user's effective permissions
- Permission cache in React context (refreshed on auth state change)

### Content Versioning: Client-side pre-update snapshot

- Version snapshots stored in `{collectionId}/{docId}/versions` subcollection
- Before each update, the client reads current doc state and writes as a new version document
- Version metadata: `{ number, authorId, timestamp, summary, data }`
- Diffs computed client-side by comparing two version documents
- Pruning: client-side policy enforcement (count + age) on write, or Firestore TTL

### Admin Analytics: Firestore aggregation

- Analytics derived from existing Firestore collections via client-side aggregation
- Content counts: Firestore `getCountFromServer` or `collectionGroup` queries
- Storage usage: sum of media document file sizes
- User activity: query entries by `updatedAt` time range, group by author
- **No operation logging middleware**: data is purely from existing documents

### Content Workflow: Firestore state machine

- Workflow config stored on collection schema: `{ states: [string], transitions: [{ from, to, requiredRole, assignee? }] }`
- Current state stored on each entry as `workflowState` field
- State machine enforced in the admin UI before write operations
- Firestore Security Rules check `workflowState` transitions
- Notifications: in-app via Firestore listener (no email server)

## Risks / Trade-offs

### General

- **Firestore read costs** → Dashboard and list views add read overhead. Mitigation: caching with TanStack Query, pagination.
- **Client-side enforcement** → Determined users could bypass UI restrictions. Mitigation: Firestore Security Rules as the definitive enforcement layer.

### Media Library

- **No server-side transformations** → Users must upload properly sized images. Acceptable for an admin tool.

### RBAC

- **Firestore Rules complexity** → Permission rules must be maintained as collections evolve. Mitigation: rule generation from schema.

### Versioning

- **Storage growth** → Version snapshots duplicate document data. Mitigation: configurable retention, Firestore TTL.

### Analytics

- **No operation-level tracking** → Analytics are derived from document existence and timestamps only. Acceptable for dashboard purposes.

### Workflow

- **No email notifications** → Users must check the admin panel for review requests. Acceptable for v1.

## Migration Plan

No breaking changes — all capabilities are additive. Each can be enabled independently:

1. Deploy Firestore collections and indexes via generated `firestore.indexes.json`
2. Deploy Firestore Security Rules via generated `firestore.rules`
3. Deploy admin UI pages (components, routes, navigation)
4. Enable in production via feature flags in config
