import type { AnalyticsByType, AnalyticsPeriod } from "./types";

export const MAX_SAMPLE = 500;
export const MEDIA_COLLECTION = "collections_media";
export const USERS_COLLECTION = "collections_users";
export const PERIOD_DAYS: Record<AnalyticsPeriod, number> = { "30d": 30, "7d": 7, "90d": 90 };

export function entryCollection(slug: string): string {
  return `collections_${slug}`;
}

export function periodStartISO(period: AnalyticsPeriod): string {
  const days = PERIOD_DAYS[period];
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function toISOString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return null;
}

const CATEGORY: Record<string, keyof AnalyticsByType> = {
  audio: "audio",
  document: "document",
  image: "image",
  other: "other",
  video: "video",
};

const DOCUMENT_KINDS = new Set(["application", "text"]);

function categorizeMime(mimeType: string): keyof AnalyticsByType {
  const slash = mimeType.indexOf("/");
  const kind = slash === -1 ? mimeType : mimeType.slice(0, slash);
  if (DOCUMENT_KINDS.has(kind)) return "document";
  return CATEGORY[kind] ?? "other";
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function mediaSizeAndMime(data: Record<string, unknown>): { size: number; mime: string } {
  const size = Number.isFinite(data.size as number) ? (data.size as number) : 0;
  const mime = asNonEmptyString(data.type) ?? asNonEmptyString(data.mimeType) ?? "";
  return { mime, size };
}

export function bucketByDay(timestamps: string[]): Array<{ date: string; count: number }> {
  const byDay = new Map<string, number>();
  for (const ts of timestamps) {
    const key = ts.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return [...byDay.entries()]
    .map(([date, count]) => ({ count, date }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function authorFields(data: Record<string, unknown>): string[] {
  const authors: string[] = [];
  for (const field of ["createdBy", "updatedBy"]) {
    const value = data[field];
    if (typeof value === "string" && value) authors.push(value);
  }
  return authors;
}

export function aggregateAuthors(authors: string[]): {
  activeUsers: number;
  topContributors: Array<{ userId: string; count: number }>;
} {
  const counts = new Map<string, number>();
  for (const author of authors) {
    counts.set(author, (counts.get(author) ?? 0) + 1);
  }
  const topContributors = [...counts.entries()]
    .map(([userId, count]) => ({ count, userId }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return { activeUsers: counts.size, topContributors };
}

export function sumMediaUsage(records: Iterable<Record<string, unknown>>): {
  totalBytes: number;
  byType: AnalyticsByType;
} {
  const byType: AnalyticsByType = { audio: 0, document: 0, image: 0, other: 0, video: 0 };
  let totalBytes = 0;
  for (const data of records) {
    const { mime, size } = mediaSizeAndMime(data);
    byType[categorizeMime(mime)] += size;
    totalBytes += size;
  }
  return { byType, totalBytes };
}
