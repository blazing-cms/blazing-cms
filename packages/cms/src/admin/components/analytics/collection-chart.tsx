interface CollectionChartProps {
  data: Array<{ count: number; slug: string }>;
}

export function CollectionChart({ data }: CollectionChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">No collections defined.</p>;
  }
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.slug} className="flex items-center gap-3">
          <span className="w-28 truncate text-sm text-muted-foreground">{d.slug}</span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded bg-primary"
              style={{ width: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="w-8 text-right text-sm font-medium">{d.count}</span>
        </div>
      ))}
    </div>
  );
}
