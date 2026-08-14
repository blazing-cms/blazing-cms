import type { AnalyticsSummary } from "@/lib/providers/types";

interface ActivityWidgetProps {
  activeUsers: number;
  topContributors: AnalyticsSummary["activity"]["topContributors"];
}

export function ActivityWidget({ activeUsers, topContributors }: ActivityWidgetProps) {
  return (
    <div>
      <p className="text-3xl font-bold">{activeUsers}</p>
      <p className="text-xs text-muted-foreground">active users in period</p>
      {topContributors.length > 0 ? (
        <ul className="mt-4 space-y-1">
          {topContributors.map((contributor) => (
            <li key={contributor.userId} className="flex items-center justify-between text-sm">
              <span className="truncate pr-3">{contributor.userId}</span>
              <span className="text-muted-foreground">{contributor.count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No contributor activity in this period.
        </p>
      )}
    </div>
  );
}
