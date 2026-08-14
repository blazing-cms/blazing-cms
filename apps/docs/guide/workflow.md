# Content Workflow

The workflow capability adds review states and transitions to collections (for
example, Draft → In Review → Published). Transitions are enforced on the client
through the SDK and reflected in the admin UI; they also drive the Workflow
Extension on collections.

## Enabling Workflow

Add a `workflow` config to a collection:

```ts
import { defineCollection, text } from "@blazing-cms/schema";

export const posts = defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  fields: [text("title", { validation: { required: true } })],
  workflow: {
    states: [
      { name: "draft", label: "Draft" },
      { name: "review", label: "In Review" },
      { name: "published", label: "Published" },
    ],
    transitions: [
      { from: "draft", to: "review" },
      { from: "review", to: "published", roles: ["role-admin", "role-editor"] },
      { from: "review", to: "draft" },
      { from: "published", to: "draft" },
    ],
    reviewerRoles: ["role-admin", "role-editor"],
    defaultState: "draft",
  },
});
```

### Config options

| Option          | Description                                                                                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `states`        | Ordered workflow states (`{ name, label? }`). Defaults to `draft → review → published → rejected` when omitted.                                                                                                                         |
| `transitions`   | Allowed state changes (`{ from, to, roles?, commentRequired? }`). `roles` limits a transition to specific role ids (empty = any user with the update grant); `commentRequired` forces a comment. Defaults to the standard publish flow. |
| `reviewerRoles` | Role ids eligible to be assigned as reviewers (empty = any user).                                                                                                                                                                       |
| `defaultState`  | State new entries start in. Defaults to the first state.                                                                                                                                                                                |

## In the Admin Panel

Collections with a `workflow` config show a workflow panel in the entry editor:

- **State badge** — the current state (falls back to `defaultState` for new entries)
- **Assign reviewer** — a selector listing admin users
- **Comment** — an optional note attached to the next transition
- **Transitions** — a button per allowed transition ("Move to {state}"). Transitions
  restricted to role ids are only shown to users holding those roles, and
  transitions into `published` require the publish permission
- **Transition history** — timeline of every transition (from → to, author, comment, timestamp)

## SDK Usage

```ts
import { createBlazeClient } from "@blazing-cms/sdk";

const client = createBlazeClient({/* firebase config */});

// Move an entry to the "in_review" state
await client.workflow.transition("posts", postId, "in_review", {
  comment: "Please review",
});

// Assign a reviewer by user id
await client.workflow.assignReviewer("posts", postId, reviewerUid);

// Transition history, newest first
const history = await client.workflow.history("posts", postId);
```

The admin panel validates transitions against the collection's transition list
and only shows actions the current user may take (reviewer-only actions are
disabled for non-reviewers).

## Data Model

Workflow state lives on the entry document itself:

| Field             | Purpose                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| `workflowState`   | The current state (a state name from the config, e.g. `draft`, `review`, `published`). |
| `reviewer`        | User id of the assigned reviewer, if any.                                              |
| `workflowHistory` | Array of transition records (`{ at, from, to, user?, comment? }`).                     |

When a collection has a `workflow` config but the capability is disabled for that
collection, the admin shows a notice and the workflow panel is hidden.

## Disabling Workflow

When the `workflow` capability is disabled (project-wide or per collection via
`config.features`), the admin hides the workflow panel and transitions are
unavailable. Collections without a `workflow` config simply have no workflow
controls.
