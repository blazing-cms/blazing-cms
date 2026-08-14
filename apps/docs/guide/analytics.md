# Analytics

The analytics capability provides content statistics for the admin dashboard,
including entry counts per collection, storage usage, and per-day change counts.

## Enabling Analytics

Analytics is enabled by default. Configure it in `blazing-cms.config.ts`:

```ts
import { defineConfig } from "@blazing-cms/cms";

export default defineConfig({
  capabilities: {
    analytics: {
      enabled: true,
      staleTimeMs: 5 * 60 * 1000, // consider results fresh for 5 minutes
    },
  },
});
```

`staleTimeMs` tunes how long analytics results are considered fresh (defaults to
no caching, results are computed per query).

## Dashboard Widgets

The dashboard uses analytics when enabled:

- **Content counts** — total collections, entries, globals, media, users
- **Entry count per collection**
- **Content changes** — count of new, updated, and deleted documents per day for
  the selected period (7d / 30d / 90d), charted over time
- **Storage usage** — used bytes of the current app (computed from media)
- **User activity** — total signed-in users

When analytics is disabled, the dashboard shows an "Analytics is disabled" notice
and the Analytics nav link and route are hidden.

## SDK Usage

```ts
import { createBlazeClient } from "@blazing-cms/sdk";

const client = createBlazeClient({/* firebase config */});

// Get analytics overview
const overview = await client.analytics.getSummary({ period: "30d" });

// Content changes for the last 30 days, all collections
const changes = await client.analytics.getContentChangesOverTime({ period: "30d" });

// Per-collection totals
const counts = await client.analytics.getContentByCollection();
```

All analytics methods return promises with types described in the
[SDK Reference](/reference/sdk#analytics). Data is read live from Firestore
counts and the media/users collections — no writes are performed.
