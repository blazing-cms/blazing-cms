interface ChangesChartProps {
  data: Array<{ count: number; date: string }>;
}

const WIDTH = 600;
const HEIGHT = 160;
const PAD = 8;

export function ChangesChart({ data }: ChangesChartProps) {
  if (data.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">No content changes in this period.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.count));
  const points = data.map((d, i) => {
    const x = PAD + (i * (WIDTH - 2 * PAD)) / Math.max(1, data.length - 1);
    const y = HEIGHT - PAD - (d.count / max) * (HEIGHT - 2 * PAD);
    return { x, y };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${PAD},${HEIGHT - PAD} ${line} ${WIDTH - PAD},${HEIGHT - PAD}`;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-40 w-full">
        <polygon className="fill-primary/10" points={area} />
        <polyline
          className="stroke-primary"
          fill="none"
          points={line}
          strokeLinejoin="round"
          strokeWidth={2}
        />
        {points.map((p, i) => (
          <circle key={i} className="fill-primary" cx={p.x} cy={p.y} r={2.5} />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
