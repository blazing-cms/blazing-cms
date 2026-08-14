import type { AnalyticsPeriod } from "@/lib/providers/types";

import { cn } from "@/lib/utils";

const PERIODS: Array<{ label: string; value: AnalyticsPeriod }> = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

interface PeriodSelectorProps {
  onChange: (period: AnalyticsPeriod) => void;
  value: AnalyticsPeriod;
}

export function PeriodSelector({ onChange, value }: PeriodSelectorProps) {
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5">
      {PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            "rounded px-3 py-1.5 text-sm font-medium transition-colors",
            value === period.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
