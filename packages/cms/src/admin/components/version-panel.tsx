import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, History, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

import type { VersionRecord, VersionTarget } from "@/lib/providers/types";

import { useToast } from "@/components/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataProvider } from "@/lib/providers/context";
import { formatVersionDate, versionTargetKey } from "@/lib/versions";

import { VersionDiff } from "./version-diff";

function versionCount(versions: VersionRecord[] | undefined): number {
  return versions?.length ?? 0;
}

function selectedVersion(
  versions: VersionRecord[] | undefined,
  id: string | null,
  fallback: number,
): VersionRecord | undefined {
  return versions?.find((v) => v.id === (id ?? versions[fallback]?.id));
}

function diffPair(a: VersionRecord | undefined, b: VersionRecord | undefined) {
  if (a === undefined || b === undefined || a.id === b.id) return null;
  return { a, b };
}

function compareInfo(
  versions: VersionRecord[] | undefined,
  comparing: boolean,
  compareA: string | null,
  compareB: string | null,
) {
  const count = versionCount(versions);
  const a = selectedVersion(versions, compareA, 0);
  const b = selectedVersion(versions, compareB, 1);
  const showCompare = comparing && count > 1;
  const diff = showCompare ? diffPair(a, b) : null;
  return { a, b, count, diff, showCompare };
}

function parentQueryKey(target: VersionTarget): string[] {
  return target.kind === "entry"
    ? ["collection", target.collection, target.id]
    : ["global", target.slug];
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function VersionValueBody({ value }: { value: unknown }) {
  if (isEmptyValue(value)) {
    return <span className="text-muted-foreground italic">—</span>;
  }
  if (typeof value === "string") {
    return <span>{value}</span>;
  }
  return <pre className="max-h-48 overflow-auto text-xs">{JSON.stringify(value, null, 2)}</pre>;
}

function VersionValue({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-2 py-1 text-sm">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">
        <VersionValueBody value={value} />
      </dd>
    </div>
  );
}

function VersionDetail({ onBack, version }: { onBack: () => void; version: VersionRecord }) {
  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Eye className="h-4 w-4" /> Version {version.number}
          <span className="text-sm font-normal text-muted-foreground">
            {formatVersionDate(version.createdAt)}
            {version.author ? ` · by ${version.author}` : ""}
          </span>
        </h3>
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to history
        </Button>
      </div>
      <dl>
        <VersionValue label="Summary" value={version.summary ?? `Version ${version.number}`} />
        {Object.entries(version.data).map(([field, value]) => (
          <VersionValue key={field} label={field} value={value} />
        ))}
      </dl>
    </div>
  );
}

function VersionListActions({
  busy,
  onDelete,
  onRestore,
  onView,
  version,
}: {
  busy: string | null;
  onDelete: (version: VersionRecord) => void;
  onRestore: (version: VersionRecord) => void;
  onView: (version: VersionRecord) => void;
  version: VersionRecord;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button variant="ghost" size="sm" onClick={() => onView(version)}>
        <Eye className="mr-1 h-4 w-4" /> View
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy === version.id}
        onClick={() => onRestore(version)}
      >
        <RotateCcw className="mr-1 h-4 w-4" /> Restore
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy === version.id}
        onClick={() => onDelete(version)}
      >
        <Trash2 className="mr-1 h-4 w-4" /> Delete
      </Button>
    </div>
  );
}

function VersionListRow({
  busy,
  onDelete,
  onRestore,
  onView,
  version,
}: {
  busy: string | null;
  onDelete: (version: VersionRecord) => void;
  onRestore: (version: VersionRecord) => void;
  onView: (version: VersionRecord) => void;
  version: VersionRecord;
}) {
  const summary = version.summary ?? `Version ${version.number}`;
  const author = version.author ? ` · by ${version.author}` : "";
  return (
    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline">v{version.number}</Badge>
          <span className="truncate text-sm font-medium">{summary}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatVersionDate(version.createdAt)}
          {author}
        </p>
      </div>
      <VersionListActions
        busy={busy}
        onDelete={onDelete}
        onRestore={onRestore}
        onView={onView}
        version={version}
      />
    </li>
  );
}

function VersionList({
  busy,
  onDelete,
  onRestore,
  onView,
  versions,
}: {
  busy: string | null;
  onDelete: (version: VersionRecord) => void;
  onRestore: (version: VersionRecord) => void;
  onView: (version: VersionRecord) => void;
  versions: VersionRecord[];
}) {
  return (
    <ul className="space-y-2">
      {versions.map((version) => (
        <VersionListRow
          key={version.id}
          busy={busy}
          onDelete={onDelete}
          onRestore={onRestore}
          onView={onView}
          version={version}
        />
      ))}
    </ul>
  );
}

function LoadingVersions() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function EmptyVersions() {
  return (
    <p className="text-sm text-muted-foreground">
      No versions yet. Versions are saved automatically when this document is updated.
    </p>
  );
}

function VersionListOrEmpty({
  busy,
  onDelete,
  onRestore,
  onView,
  versions,
}: {
  busy: string | null;
  onDelete: (version: VersionRecord) => void;
  onRestore: (version: VersionRecord) => void;
  onView: (version: VersionRecord) => void;
  versions: VersionRecord[] | undefined;
}) {
  if (versions === undefined || versions.length === 0) return <EmptyVersions />;
  return (
    <VersionList
      busy={busy}
      onDelete={onDelete}
      onRestore={onRestore}
      onView={onView}
      versions={versions}
    />
  );
}

function selectedId(version: VersionRecord | undefined): string {
  return version?.id ?? "";
}

function CompareControls({
  a,
  b,
  onSelectA,
  onSelectB,
  versions,
}: {
  a: VersionRecord | undefined;
  b: VersionRecord | undefined;
  onSelectA: (id: string) => void;
  onSelectB: (id: string) => void;
  versions: VersionRecord[];
}) {
  const options = versions.map((v) => (
    <option key={v.id} value={v.id}>
      v{v.number} — {formatVersionDate(v.createdAt)}
    </option>
  ));
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <label className="flex items-center gap-2 text-sm">
        From
        <select
          value={selectedId(a)}
          onChange={(e) => onSelectA(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm"
        >
          {options}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        To
        <select
          value={selectedId(b)}
          onChange={(e) => onSelectB(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm"
        >
          {options}
        </select>
      </label>
    </div>
  );
}

function VersionPanelBody({
  busy,
  diff,
  isLoading,
  onBack,
  onDelete,
  onRestore,
  onView,
  versions,
  viewing,
}: {
  busy: string | null;
  diff: { a: VersionRecord; b: VersionRecord } | null;
  isLoading: boolean;
  onBack: () => void;
  onDelete: (version: VersionRecord) => void;
  onRestore: (version: VersionRecord) => void;
  onView: (version: VersionRecord) => void;
  versions: VersionRecord[] | undefined;
  viewing: VersionRecord | null;
}) {
  if (viewing) return <VersionDetail onBack={onBack} version={viewing} />;
  if (diff) return <VersionDiff before={diff.a} after={diff.b} />;
  if (isLoading) return <LoadingVersions />;
  return (
    <VersionListOrEmpty
      busy={busy}
      onDelete={onDelete}
      onRestore={onRestore}
      onView={onView}
      versions={versions}
    />
  );
}

function VersionPanelHeader({
  comparing,
  count,
  onToggle,
}: {
  comparing: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <History className="h-4 w-4" /> Version History
        {count > 0 && <Badge variant="secondary">{count} saved</Badge>}
      </h2>
      {count > 1 && (
        <Button variant="outline" size="sm" onClick={onToggle}>
          {comparing ? "Hide compare" : "Compare versions"}
        </Button>
      )}
    </div>
  );
}

interface VersionPanelProps {
  standalone?: boolean;
  target: VersionTarget;
}

export function VersionPanel({ standalone = false, target }: VersionPanelProps) {
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const targetKey = versionTargetKey(target);
  const [viewing, setViewing] = useState<VersionRecord | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryFn: () => provider.listVersions(target),
    queryKey: ["versions", targetKey],
  });

  const { a, b, count, diff, showCompare } = compareInfo(versions, comparing, compareA, compareB);

  async function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["versions", targetKey] });
    void queryClient.invalidateQueries({ queryKey: parentQueryKey(target) });
  }

  async function restore(version: VersionRecord) {
    if (
      !window.confirm(
        `Restore to version ${version.number}? The current state will be saved as a new version first.`,
      )
    ) {
      return;
    }
    setBusy(version.id);
    try {
      await provider.restoreVersion(target, version.id);
      addToast({ description: `Restored to version ${version.number}.`, title: "Restored" });
      await invalidate();
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  async function remove(version: VersionRecord) {
    if (!window.confirm(`Delete version ${version.number}? This cannot be undone.`)) return;
    setBusy(version.id);
    try {
      await provider.deleteVersion(target, version.id);
      addToast({ description: `Deleted version ${version.number}.`, title: "Deleted" });
      await invalidate();
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={standalone ? "" : "mt-8 border-t pt-6"}>
      <VersionPanelHeader
        comparing={comparing}
        count={count}
        onToggle={() => setComparing((c) => !c)}
      />
      {showCompare && (
        <CompareControls
          a={a}
          b={b}
          onSelectA={setCompareA}
          onSelectB={setCompareB}
          versions={versions ?? []}
        />
      )}
      <VersionPanelBody
        busy={busy}
        diff={diff}
        isLoading={isLoading}
        onBack={() => setViewing(null)}
        onDelete={remove}
        onRestore={restore}
        onView={setViewing}
        versions={versions}
        viewing={viewing}
      />
    </div>
  );
}
