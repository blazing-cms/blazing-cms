## 1. Media Library

- [x] 1.1 Define Firestore `media` collection schema and indexes in types package
- [x] 1.2 Configure Firebase Storage bucket rules and upload presets
- [x] 1.3 Implement media upload via Firebase Storage client SDK (`uploadBytesResumable` + `getDownloadURL`)
- [x] 1.4 Implement media CRUD operations via Firestore client SDK directly
- [x] 1.5 Add folder/tag organization (folders as Firestore documents, tags as array fields)
- [x] 1.6 Implement media search via Firestore client-side queries (filename, tag, caption)
- [x] 1.7 Implement media usage tracking (find references across collections via client query)
- [x] 1.8 Build admin UI: media library page with grid/list view, upload dropzone
- [x] 1.9 Build admin UI: media detail page with preview, metadata, usage, replace
- [x] 1.10 Build admin UI: folder tree navigation and tag management
- [x] 1.11 Build admin UI: media picker component for rich text / field inputs
- [x] 1.12 Add SDK methods for media operations
- [x] 1.13 Write tests for media operations

## 2. Role-Based Access Control

- [x] 2.1 Define RBAC data models: `roles`, `user_roles` collections, permission schema in types
- [x] 2.2 Implement role CRUD via Firestore client SDK
- [x] 2.3 Implement user-role assignment via Firestore client SDK
- [x] 2.4 Implement permission cache in React context (refreshed on auth state change)
- [x] 2.5 Apply permission checks via Firestore Security Rules (definitive enforcement)
- [x] 2.6 Add UI-side permission enforcement (hide/disable elements based on cached permissions)
- [x] 2.7 Add field-level permission support (read-only or hidden per field group)
- [x] 2.8 Implement deny logging — client-side reporting to Firestore `access_logs` collection
- [x] 2.9 Migrate existing access control to use new RBAC system
- [x] 2.10 Add SDK methods for role and permission queries
- [x] 2.11 Write tests for RBAC context, Security Rules, and integration

## 3. API Rate Limiting ❌ NOT APPLICABLE (CLIENT-SIDE ONLY)

> **CONFLICT with client-side-only architecture:** Rate limiting is a server-side concept that requires a centralized request gateway. In a client-side-only app where all data access goes directly through the Firebase client SDK to Firestore, there is no application-level API to rate-limit. Firestore itself has built-in rate limiting and quota enforcement via the Firebase platform. This capability should be removed from the roadmap unless a server-side layer is introduced later.

## 4. Content Versioning

- [x] 4.1 Define version schema and Firestore subcollection indexes in types
- [x] 4.2 Implement pre-update snapshot hook — client reads current doc state and writes version to subcollection before each update
- [x] 4.3 Implement version list via Firestore subcollection query
- [x] 4.4 Implement rollback — write current state as new version, then restore target version's data
- [x] 4.5 Implement version pruning — client-side on write (retain last N versions); support Firestore TTL policies for age-based pruning
- [x] 4.6 Build admin UI: version history panel with timeline view
- [x] 4.7 Build admin UI: diff view between versions (side-by-side)
- [x] 4.8 Build admin UI: rollback with confirmation dialog
- [x] 4.9 Extend versioning to globals
- [x] 4.10 Add SDK methods for version operations
- [x] 4.11 Write tests for version snapshots, rollback, pruning

## 5. Admin Analytics

- [x] 5.1 Implement content statistics via Firestore `getCountFromServer` aggregation queries
- [x] 5.2 Implement storage usage summary (sum `size` field from `media` collection documents)
- [x] 5.3 Implement user activity tracking (query `createdBy`/`updatedBy` fields across collections)
- [x] 5.4 Data retention/pruning — N/A, analytics is derived live from existing documents (no collected data to prune)
- [x] 5.5 Build admin UI: dashboard widgets (content counts, charts, storage usage)
- [x] 5.6 Build admin UI: analytics page with time period selector
- [x] 5.7 Add SDK methods for analytics queries
- [x] 5.8 Write tests for analytics queries and data derivation

## 6. Content Workflow

- [x] 6.1 Define workflow state machine schema and entry `workflowState` field in types
- [x] 6.2 Implement workflow config on collection schema (states, transitions, role requirements)
- [x] 6.3 Enforce workflow state transitions in the admin UI before write operations; rely on Firestore Security Rules for server-side enforcement
- [x] 6.4 Implement workflow transition logic (client-side state validation + Firestore write)
- [x] 6.5 Implement reviewer assignment (by user, by role) in Firestore
- [x] 6.6 Implement in-app notifications via Firestore listener (no email/server)
- [x] 6.7 Implement workflow audit log in Firestore subcollection
- [x] 6.8 Build admin UI: workflow state indicator and transition buttons in entry header
- [x] 6.9 Build admin UI: reviewer assignment selector
- [x] 6.10 Build admin UI: workflow history panel
- [x] 6.11 Add SDK methods for workflow operations
- [x] 6.12 Write tests for workflow transitions, permissions, and rollback

## 7. Shared Infrastructure

- [x] 7.1 Deploy Firestore indexes and Security Rules for all new collections
- [x] 7.2 Add configuration schema entries for all capabilities (defaults + overrides)
- [x] 7.3 Update admin sidebar navigation with new feature links
- [x] 7.4 Add feature flags for each capability (enable/disable via config)
- [x] 7.5 Update TSDoc documentation across new packages and routes
- [x] 7.6 Create e2e tests for critical paths across capabilities
