import type { AnalyticsSummary } from "@/lib/providers/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContentStatsProps {
  counts: AnalyticsSummary["counts"];
}

export function ContentStats({ counts }: ContentStatsProps) {
  const stats = [
    { label: "Collections", value: counts.totalCollections },
    { label: "Entries", value: counts.totalEntries },
    { label: "Globals", value: counts.totalGlobals },
    { label: "Media", value: counts.totalMedia },
    { label: "Users", value: counts.totalUsers },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
