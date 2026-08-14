import type { AnalyticsByType } from "@/lib/providers/types";

import { formatBytes } from "@/lib/utils";

interface StorageWidgetProps {
  byType: AnalyticsByType;
  totalBytes: number;
}

const ROWS = [
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "audio", label: "Audio" },
  { key: "document", label: "Documents" },
  { key: "other", label: "Other" },
] as const;

export function StorageWidget({ byType, totalBytes }: StorageWidgetProps) {
  const max = Math.max(1, ...ROWS.map((r) => byType[r.key]));
  return (
    <div>
      <p className="text-3xl font-bold">{formatBytes(totalBytes)}</p>
      <p className="text-xs text-muted-foreground">total storage used</p>
      <div className="mt-4 space-y-2">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center gap-3">
            <span className="w-20 text-sm text-muted-foreground">{row.label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded bg-primary"
                style={{
                  width: `${Math.max((byType[row.key] / max) * 100, byType[row.key] > 0 ? 4 : 0)}%`,
                }}
              />
            </div>
            <span className="w-20 text-right text-sm">{formatBytes(byType[row.key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
