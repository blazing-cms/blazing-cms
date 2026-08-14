import type { VersionRecord, VersionTarget } from "@/lib/providers/types";

export interface VersionDiffEntry {
  field: string;
  before: unknown;
  after: unknown;
  changed: boolean;
}

export function diffVersionData(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): VersionDiffEntry[] {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...fields].sort().map((field) => {
    const a = before[field];
    const b = after[field];
    return { after: b, before: a, changed: JSON.stringify(a) !== JSON.stringify(b), field };
  });
}

export function formatVersionDate(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export function versionTargetKey(target: VersionTarget): string {
  return target.kind === "entry" ? `${target.collection}/${target.id}` : `global/${target.slug}`;
}

export function summarizeVersion(version: VersionRecord): string {
  return version.summary ?? `Version ${version.number}`;
}

export function versionLabel(version: VersionRecord): string {
  return `v${version.number}`;
}

export function changedFieldCount(version: VersionRecord, baseline: VersionRecord): number {
  return diffVersionData(baseline.data, version.data).filter((d) => d.changed).length;
}
