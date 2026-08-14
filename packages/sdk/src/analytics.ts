import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

import type {
  AnalyticsApi,
  AnalyticsConfig,
  AnalyticsPeriod,
  AnalyticsQueryOptions,
  AnalyticsScope,
  AnalyticsSummary,
  ChangesOverTime,
  CollectionCount,
  ContentCounts,
  StorageUsage,
  UserActivity,
} from "./types.js";

export const PERIOD_DAYS: Record<AnalyticsPeriod, number> = { "30d": 30, "7d": 7, "90d": 90 };
const MAX_SAMPLE = 500;
const TOP_CONTRIBUTOR_LIMIT = 10;

export const MEDIA_COLLECTION = "collections_media";
export const USERS_COLLECTION = "collections_users";

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

const CATEGORY: Record<string, keyof StorageUsage["byType"]> = {
  audio: "audio",
  document: "document",
  image: "image",
  other: "other",
  video: "video",
};

const DOCUMENT_KINDS = new Set(["application", "text"]);

export function categorizeMime(mimeType: string): keyof StorageUsage["byType"] {
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

export function pickPrimaryAuthor(data: Record<string, unknown>): string | null {
  const createdBy = typeof data.createdBy === "string" ? data.createdBy : null;
  const updatedBy = typeof data.updatedBy === "string" ? data.updatedBy : null;
  return createdBy ?? updatedBy;
}

export function bucketByDay(timestamps: string[]): ChangesOverTime["points"] {
  const byDay = new Map<string, number>();
  for (const ts of timestamps) {
    const key = ts.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return [...byDay.entries()]
    .map(([date, count]) => ({ count, date }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateAuthors(authors: string[]): UserActivity {
  const counts = new Map<string, number>();
  for (const author of authors) {
    counts.set(author, (counts.get(author) ?? 0) + 1);
  }
  const topContributors = [...counts.entries()]
    .map(([userId, count]) => ({ count, userId }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_CONTRIBUTOR_LIMIT);
  return { activeUsers: counts.size, topContributors };
}

const EMPTY_BY_TYPE: StorageUsage["byType"] = {
  audio: 0,
  document: 0,
  image: 0,
  other: 0,
  video: 0,
};
const EMPTY_COUNTS: ContentCounts = {
  totalCollections: 0,
  totalEntries: 0,
  totalGlobals: 0,
  totalMedia: 0,
  totalUsers: 0,
};
const EMPTY_SUMMARY: AnalyticsSummary = {
  activity: { activeUsers: 0, topContributors: [] },
  byCollection: [],
  changes: { period: "30d", points: [] },
  counts: EMPTY_COUNTS,
  storage: { byType: EMPTY_BY_TYPE, totalBytes: 0 },
};

export function createAnalyticsApi(db: Firestore, config: AnalyticsConfig = {}): AnalyticsApi {
  if (config.enabled === false) {
    return {
      getContentByCollection: async () => [],
      getContentChangesOverTime: async () => EMPTY_SUMMARY.changes,
      getContentCounts: async () => EMPTY_COUNTS,
      getStorageUsage: async () => EMPTY_SUMMARY.storage,
      getSummary: async () => EMPTY_SUMMARY,
      getUserActivity: async () => EMPTY_SUMMARY.activity,
    };
  }

  const api: AnalyticsApi = {
    getContentByCollection: (scope) => getContentByCollection(db, scope),
    getContentChangesOverTime: (options) => getContentChangesOverTime(db, options),
    getContentCounts: (scope) => getContentCounts(db, scope),
    getStorageUsage: () => getStorageUsage(db),
    getSummary: (options) => getSummary(db, options),
    getUserActivity: (options) => getUserActivity(db, options),
  };

  return api;
}

async function getContentCounts(db: Firestore, scope: AnalyticsScope = {}): Promise<ContentCounts> {
  const collections = scope.collections ?? [];
  const globals = scope.globals ?? [];
  const [totalEntries, totalGlobals, totalMedia, totalUsers] = await Promise.all([
    sumCounts(db, collections.map(entryCollection)),
    sumCounts(
      db,
      globals.map((slug) => `globals_${slug}`),
    ),
    countCollection(db, MEDIA_COLLECTION),
    countCollection(db, USERS_COLLECTION),
  ]);
  return {
    totalCollections: collections.length,
    totalEntries,
    totalGlobals,
    totalMedia,
    totalUsers,
  };
}

async function sumCounts(db: Firestore, names: string[]): Promise<number> {
  let total = 0;
  for (const name of names) {
    total += await countCollection(db, name);
  }
  return total;
}

async function getContentByCollection(
  db: Firestore,
  scope: AnalyticsScope = {},
): Promise<CollectionCount[]> {
  const collections = scope.collections ?? [];
  const results: CollectionCount[] = [];
  for (const slug of collections) {
    results.push({ count: await countCollection(db, entryCollection(slug)), slug });
  }
  return results;
}

async function getContentChangesOverTime(
  db: Firestore,
  options: AnalyticsQueryOptions = {},
): Promise<ChangesOverTime> {
  const period = options.period ?? "30d";
  const collections = options.scope?.collections ?? [];
  const dates = await collectSince(db, collections, periodStartISO(period), (data) =>
    toISOString(data.createdAt),
  );
  return { period, points: bucketByDay(dates) };
}

async function getStorageUsage(db: Firestore): Promise<StorageUsage> {
  const byType: StorageUsage["byType"] = { ...EMPTY_BY_TYPE };
  let totalBytes = 0;
  try {
    const snap = await getDocs(query(collection(db, MEDIA_COLLECTION), limit(MAX_SAMPLE)));
    for (const doc of snap.docs) {
      const { mime, size } = mediaSizeAndMime(doc.data() as Record<string, unknown>);
      byType[categorizeMime(mime)] += size;
      totalBytes += size;
    }
  } catch {
    // storage query failed — report zeroed usage
  }
  return { byType, totalBytes };
}

async function getUserActivity(
  db: Firestore,
  options: AnalyticsQueryOptions = {},
): Promise<UserActivity> {
  const period = options.period ?? "30d";
  const collections = options.scope?.collections ?? [];
  const authors = await collectSince(db, collections, periodStartISO(period), pickPrimaryAuthor);
  return aggregateAuthors(authors);
}

async function getSummary(
  db: Firestore,
  options: AnalyticsQueryOptions = {},
): Promise<AnalyticsSummary> {
  const scope = options.scope ?? {};
  const [counts, byCollection, changes, storage, activity] = await Promise.all([
    getContentCounts(db, scope),
    getContentByCollection(db, scope),
    getContentChangesOverTime(db, options),
    getStorageUsage(db),
    getUserActivity(db, options),
  ]);
  return { activity, byCollection, changes, counts, storage };
}

async function countCollection(db: Firestore, name: string): Promise<number> {
  try {
    const snap = await getCountFromServer(collection(db, name));
    return snap.data().count;
  } catch {
    return 0;
  }
}

async function collectSince(
  db: Firestore,
  collections: string[],
  startISO: string,
  pick: (data: Record<string, unknown>) => string | null,
): Promise<string[]> {
  const values: string[] = [];
  for (const slug of collections) {
    const picked = await fetchDocsSince(db, entryCollection(slug), startISO, pick);
    values.push(...picked);
  }
  return values;
}

async function fetchDocsSince(
  db: Firestore,
  name: string,
  startISO: string,
  pick: (data: Record<string, unknown>) => string | null,
): Promise<string[]> {
  try {
    const q = query(collection(db, name), where("createdAt", ">=", startISO), limit(MAX_SAMPLE));
    const snap = await getDocs(q);
    const values: string[] = [];
    for (const doc of snap.docs) {
      const value = pick(doc.data() as Record<string, unknown>);
      if (value) values.push(value);
    }
    return values;
  } catch {
    return [];
  }
}
