## Why

Blazing CMS currently provides core primitives for headless content management, but several platform-grade features are missing. Adding these capabilities — implemented entirely through the Firebase client SDK and Firestore — will make the CMS production-ready for a wider range of use cases.

**Architecture constraint:** Client-side only — no backend server, no custom REST API layer, no Cloud Functions. All data access goes through the Firebase client SDK directly to Firestore. Security Rules are the definitive enforcement layer.

## What Changes

- Add a full **Media Library** with upload, storage, transformation, and organization (Firebase Storage + Firestore)
- Implement **Role-Based Access Control (RBAC)** with granular permissions (Firestore Security Rules + client enforcement)
- Add **Content Versioning / History** for audit trails and rollback (subcollections + client-side snapshot)
- Build **Admin Dashboard Analytics** for usage insights (Firestore aggregation queries)
- Add **Content Workflow / Approval** for multi-stage publishing (state machine in Firestore)

## Capabilities

### New Capabilities

- `media-library`: Asset upload to Firebase Storage, metadata in Firestore, folder/tag organization, admin UI grid view
- `role-based-access-control`: Roles and permissions enforced via Firestore Security Rules, with UI-side conditional rendering
- `content-versioning`: Snapshot-based version history in subcollections, client-side diff view, and rollback
- `admin-analytics`: Firestore aggregation queries for content counts, operation trends, storage usage, and user activity
- `content-workflow`: Draft → Review → Published state machine, reviewer assignment, client-side enforcement

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **packages/cms**: New admin UI routes/pages for media, analytics, workflow, version history; Firestore Security Rules updates
- **packages/storage**: Firebase Storage integration for media uploads and transformations
- **packages/database**: New Firestore collections for media, versions, workflow states, analytics summaries
- **packages/auth**: Role/permission model for Firestore Security Rules
- **packages/permissions**: Extend for RBAC with Security Rules integration
- **packages/types**: New type definitions across all capabilities
- **packages/sdk**: New SDK methods for media, analytics, workflows, versioning
- Firebase: New Firestore collections with indexes, Storage bucket for media, Security Rules for RBAC
