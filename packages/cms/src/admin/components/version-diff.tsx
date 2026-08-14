import type { VersionRecord } from "@/lib/providers/types";

import { cn } from "@/lib/utils";
import { diffVersionData, versionLabel } from "@/lib/versions";

function Value({ value }: { value: unknown }) {
  if (value === undefined) {
    return <span className="text-muted-foreground italic">—</span>;
  }
  if (typeof value === "string" && value.length > 0) {
    return <span className="whitespace-pre-wrap break-words">{value}</span>;
  }
  return <pre className="max-h-40 overflow-auto text-xs">{JSON.stringify(value, null, 2)}</pre>;
}

export function VersionDiff({ after, before }: { before: VersionRecord; after: VersionRecord }) {
  const entries = diffVersionData(before.data, after.data);
  const changed = entries.filter((entry) => entry.changed);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="border-b bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
        Comparing <span className="font-semibold text-foreground">{versionLabel(before)}</span> →{" "}
        <span className="font-semibold text-foreground">{versionLabel(after)}</span> ·{" "}
        {changed.length} changed field{changed.length === 1 ? "" : "s"}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-40 px-4 py-2 font-medium">Field</th>
              <th className="border-l px-4 py-2 font-medium">{versionLabel(before)}</th>
              <th className="border-l px-4 py-2 font-medium">{versionLabel(after)}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.field}
                className={cn("align-top", entry.changed && "bg-yellow-50 dark:bg-yellow-950/25")}
              >
                <td className="px-4 py-2 font-medium">{entry.field}</td>
                <td className="border-l px-4 py-2 text-muted-foreground">
                  <Value value={entry.before} />
                </td>
                <td className="border-l px-4 py-2">
                  <Value value={entry.after} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
