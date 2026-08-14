export type QueryOperator =
  "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not-in" | "array-contains" | "array-contains-any";

export interface QueryFilterValue {
  op: QueryOperator;
  value: unknown;
}

export function isFilterValue(val: unknown): val is QueryFilterValue {
  return val !== null && typeof val === "object" && "op" in val;
}

export interface QueryOptions {
  limit?: number;
  cursor?: string;
  filter?: Record<string, unknown | QueryFilterValue>;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  cursor?: string;
  hasMore: boolean;
}

export interface MediaUploadOptions {
  folder?: string | null;
  tags?: string[];
  altText?: string;
  caption?: string;
  onProgress?: (percent: number) => void;
}

export interface MediaUploadResult {
  id: string;
  name: string;
  url: string;
}

export type AnalyticsPeriod = "7d" | "30d" | "90d";

export interface AnalyticsByType {
  image: number;
  video: number;
  audio: number;
  document: number;
  other: number;
}

export interface AnalyticsQuery {
  period: AnalyticsPeriod;
  collections: string[];
  globals: string[];
}

export interface AnalyticsSummary {
  counts: {
    totalCollections: number;
    totalEntries: number;
    totalGlobals: number;
    totalMedia: number;
    totalUsers: number;
  };
  byCollection: Array<{ slug: string; count: number }>;
  changes: Array<{ date: string; count: number }>;
  storage: { totalBytes: number; byType: AnalyticsByType };
  activity: {
    activeUsers: number;
    topContributors: Array<{ userId: string; count: number }>;
  };
}

export type VersionTarget =
  { kind: "entry"; collection: string; id: string } | { kind: "global"; slug: string };

export interface VersionRecord {
  id: string;
  /** Sequential version number, starting at 1. */
  number: number;
  /** Snapshot of the entry/global data at save time. */
  data: Record<string, unknown>;
  author?: string;
  createdAt: string;
  summary?: string;
}

export interface TransitionEntryOptions {
  comment?: string;
  reviewer?: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  message: string;
  collection?: string;
  entryId?: string;
  read: boolean;
  createdAt: string;
}

export interface DataProvider {
  name: string;
  type: "firebase" | "mock";

  findOne(collection: string, id: string): Promise<Record<string, unknown> | null>;
  findMany(
    collection: string,
    options?: QueryOptions,
  ): Promise<PaginatedResult<Record<string, unknown>>>;
  create(collection: string, data: Record<string, unknown>): Promise<string>;
  update(collection: string, id: string, data: Record<string, unknown>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;

  getGlobal(slug: string): Promise<Record<string, unknown> | null>;
  upsertGlobal(slug: string, data: Record<string, unknown>): Promise<void>;

  listVersions(target: VersionTarget): Promise<VersionRecord[]>;
  getVersion(target: VersionTarget, versionId: string): Promise<VersionRecord | null>;
  restoreVersion(target: VersionTarget, versionId: string): Promise<void>;
  deleteVersion(target: VersionTarget, versionId: string): Promise<void>;

  getAnalytics(query: AnalyticsQuery): Promise<AnalyticsSummary>;

  transitionEntry(
    collection: string,
    id: string,
    to: string,
    options?: TransitionEntryOptions,
  ): Promise<void>;
  assignReviewer(collection: string, id: string, userId: string): Promise<void>;

  listNotifications(userId: string): Promise<NotificationRecord[]>;
  markNotificationsRead(ids: string[]): Promise<void>;

  uploadMedia(file: File, options?: MediaUploadOptions): Promise<MediaUploadResult>;
  replaceMedia(id: string, file: File, options?: MediaUploadOptions): Promise<{ url: string }>;
  deleteMedia(id: string): Promise<void>;
}
