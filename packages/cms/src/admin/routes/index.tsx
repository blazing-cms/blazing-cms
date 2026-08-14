import { Link } from "@tanstack/react-router";
import { createRoute } from "@tanstack/react-router";
import { BarChart3, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { AnalyticsPeriod } from "@/lib/providers/types";

import { ActivityWidget } from "@/components/analytics/activity-widget";
import { ChangesChart } from "@/components/analytics/changes-chart";
import { CollectionChart } from "@/components/analytics/collection-chart";
import { ContentStats } from "@/components/analytics/content-stats";
import { PeriodSelector } from "@/components/analytics/period-selector";
import { StorageWidget } from "@/components/analytics/storage-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/use-analytics";
import { featureEnabled } from "@/lib/features";
import { appLayoutRoute } from "@/routes/app-layout";

export const indexRoute = createRoute({
  component: Dashboard,
  getParentRoute: () => appLayoutRoute,
  path: "/",
});

function Dashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, isLoading } = useAnalytics(period);
  const analyticsEnabled = featureEnabled("analytics");

  if (!analyticsEnabled) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Analytics is disabled for this project.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Content overview and activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector onChange={setPeriod} value={period} />
          <Link
            to="/analytics"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Full analytics <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        data && (
          <>
            <div className="mb-6">
              <ContentStats counts={data.counts} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Content by Collection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CollectionChart data={data.byCollection} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Content Changes Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChangesChart data={data.changes} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Storage Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <StorageWidget
                    byType={data.storage.byType}
                    totalBytes={data.storage.totalBytes}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityWidget
                    activeUsers={data.activity.activeUsers}
                    topContributors={data.activity.topContributors}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )
      )}
    </div>
  );
}
