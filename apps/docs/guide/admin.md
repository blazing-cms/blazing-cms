# Admin Panel

The admin panel is auto-generated from your schema files. Access it at `http://localhost:5173/` when the dev server is running.

## Navigation

The sidebar is generated from your schema definitions:

- **Overview** — Dashboard, Analytics (when enabled), Media, plus Users, Roles, and Schemas (dev mode) and Settings
- **Content / grouped sections** — each `admin.group` becomes a sidebar section listing its collections and globals

Press `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) to open the command palette for quick navigation.

## Dashboard

The dashboard shows:

- Total content counts (collections, entries, globals, media, users)
- Entry count per collection
- Content changes over the selected period (7d / 30d / 90d)
- Storage usage and user activity

When analytics is disabled in config, the dashboard shows a "Analytics is disabled" notice and the Analytics nav link and route are hidden.

## Collections

Each collection gets list and entry routes:

- **List view** — entries with the configured title field (`admin.useAsTitle`), default sort, and search
- **New entry** — `/collections/new/<slug>`, schema-driven form
- **Edit entry** — `/collections/<slug>/<id>`, schema-driven form with workflow panel and version history

Entry forms render every field from the schema definition using the matching input
(rich text, markdown, code, media picker, select, relation, components, dynamic
zones, arrays, and so on).

## Workflow

Collections with a `workflow` config show a workflow panel in the entry editor:
a state badge, transition buttons (Submit for Review, Approve, Reject, Unpublish),
a reviewer selector, and a transition history. See [Workflow](/guide/workflow).

## Version History

Entries and globals with versioning enabled have a "Version History" button that
opens `/collections/<slug>/<id>/revisions` (or `/globals/<slug>/revisions`):
timeline of versions, side-by-side diff, and rollback. See [Versioning](/guide/versioning).

## Media Library

Upload, browse, organize (folders and tags), search, and manage media assets.
Media files go to Firebase Storage; metadata lives in Firestore. See [Media](/guide/media).

## Users and Roles

- **Users** — list, create, edit, delete admin users, and assign roles
- **Roles** — create, edit, delete roles with granular collection and system permissions

See [RBAC](/guide/rbac).

## Settings

- **General** — project name and settings
- **Plugins** — searchable plugin directory with status badges

## Schema Editor

In dev mode, the **Schemas** section lets you browse and edit schema definitions
(collections, globals, components). Saving writes the schema file to disk and
triggers regeneration.

## Rich Text Editor

Rich text fields use Tiptap with support for:

- Bold, italic, underline, strikethrough
- Headings (H1-H3)
- Lists (ordered, bullet)
- Blockquotes
- Code blocks
- Undo/redo

## Code Editor

Code fields use CodeMirror 6 with syntax highlighting for JavaScript, TypeScript, JSX, TSX, JSON, CSS, HTML, Markdown, and XML.

## Notifications

The bell icon in the header shows in-app notifications (e.g. workflow state changes
assigned to you) delivered via a Firestore listener.
