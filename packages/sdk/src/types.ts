import type { FeatureFlags } from "@blazing-cms/types";
import type { User } from "firebase/auth";

export interface BlazeClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
  measurementId?: string;
  analytics?: AnalyticsConfig;
  media?: MediaConfig;
  /**
   * Resolved capability flags. A disabled capability keeps its API surface but
   * returns empty results (or throws for writes), following the analytics
   * precedent. Defaults to every capability enabled.
   */
  features?: FeatureFlags;
}

export interface MediaConfig {
  /** Max upload size in bytes. Defaults to 20MB. */
  maxFileSize?: number;
}

export interface AnalyticsConfig {
  /** Enable/disable analytics queries. Disabled analytics return empty results. */
  enabled?: boolean;
  /** How long analytics results are considered fresh, in milliseconds. */
  staleTimeMs?: number;
}

export interface QueryFilter {
  field: string;
  op:
    | "=="
    | "!="
    | ">"
    | ">="
    | "<"
    | "<="
    | "in"
    | "not-in"
    | "array-contains"
    | "array-contains-any";
  value: unknown;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: { field: string; direction?: "asc" | "desc" };
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T = Record<string, unknown>> {
  data: T[];
  hasMore: boolean;
  cursor?: string;
}

export interface CollectionApi {
  findMany(options?: QueryOptions): Promise<PaginatedResult>;
  findById(id: string): Promise<Record<string, unknown> | null>;
  create(data: Record<string, unknown>): Promise<string>;
  update(id: string, data: Record<string, unknown>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface GlobalApi {
  get(slug: string): Promise<Record<string, unknown> | null>;
  upsert(slug: string, data: Record<string, unknown>): Promise<void>;
}

export interface AuthApi {
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  onAuthChange(cb: (user: User | null) => void): () => void;
  getCurrentUser(): User | null;
}

export type AnalyticsPeriod = "7d" | "30d" | "90d";

/** Which collections/globals to include in analytics queries. */
export interface AnalyticsScope {
  /** Entry collection slugs (e.g. `["posts", "categories"]`). */
  collections?: string[];
  /** Global slugs. */
  globals?: string[];
}

export interface ContentCounts {
  totalCollections: number;
  totalEntries: number;
  totalGlobals: number;
  totalMedia: number;
  totalUsers: number;
}

export interface CollectionCount {
  slug: string;
  count: number;
}

export interface ChangesOverTimePoint {
  /** YYYY-MM-DD */
  date: string;
  count: number;
}

export interface ChangesOverTime {
  period: AnalyticsPeriod;
  points: ChangesOverTimePoint[];
}

export interface StorageByType {
  image: number;
  video: number;
  audio: number;
  document: number;
  other: number;
}

export interface StorageUsage {
  totalBytes: number;
  byType: StorageByType;
}

export interface TopContributor {
  userId: string;
  count: number;
}

export interface UserActivity {
  activeUsers: number;
  topContributors: TopContributor[];
}

export interface AnalyticsSummary {
  counts: ContentCounts;
  byCollection: CollectionCount[];
  changes: ChangesOverTime;
  storage: StorageUsage;
  activity: UserActivity;
}

export interface AnalyticsQueryOptions {
  period?: AnalyticsPeriod;
  scope?: AnalyticsScope;
}

export interface AnalyticsApi {
  /** Total entry/global/media/user counts, queried via Firestore aggregation. */
  getContentCounts(scope?: AnalyticsScope): Promise<ContentCounts>;
  /** Entry count per collection. */
  getContentByCollection(scope?: AnalyticsScope): Promise<CollectionCount[]>;
  /** Entry creation counts bucketed per day over the selected period. */
  getContentChangesOverTime(options?: AnalyticsQueryOptions): Promise<ChangesOverTime>;
  /** Total media storage and breakdown by file type. */
  getStorageUsage(): Promise<StorageUsage>;
  /** Active users and top contributors derived from authorship fields. */
  getUserActivity(options?: AnalyticsQueryOptions): Promise<UserActivity>;
  /** Combined summary for the dashboard. */
  getSummary(options?: AnalyticsQueryOptions): Promise<AnalyticsSummary>;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  mimeType: string;
  size: number;
  folder: string | null;
  tags: string[];
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parent: string | null;
  createdAt: string;
}

export interface MediaQueryOptions {
  /** Filter by folder id; pass `null` for root-level assets. */
  folder?: string | null;
  /** Filter by a tag using Firestore `array-contains`. */
  tag?: string;
  /** Client-side substring match on name, alt text, caption, and tags. */
  search?: string;
  limit?: number;
}

export interface MediaUploadOptions {
  folder?: string | null;
  tags?: string[];
  altText?: string;
  caption?: string;
  onProgress?: (percent: number) => void;
}

export interface MediaUsage {
  collection: string;
  count: number;
}

export interface MediaFoldersApi {
  list(): Promise<MediaFolder[]>;
  create(name: string, parent?: string | null): Promise<MediaFolder>;
  rename(id: string, name: string): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface MediaApi {
  list(options?: MediaQueryOptions): Promise<MediaItem[]>;
  get(id: string): Promise<MediaItem | null>;
  upload(file: File, options?: MediaUploadOptions): Promise<MediaItem>;
  update(
    id: string,
    data: Partial<Pick<MediaItem, "altText" | "caption" | "folder" | "name" | "tags">>,
  ): Promise<void>;
  replace(id: string, file: File, onProgress?: (percent: number) => void): Promise<MediaItem>;
  remove(id: string): Promise<void>;
  usage(id: string, collections: string[]): Promise<MediaUsage[]>;
  folders: MediaFoldersApi;
}

export type RbacCollectionAction = "create" | "read" | "update" | "delete" | "publish";

export type RbacSystemAction =
  "manageUsers" | "manageRoles" | "manageMedia" | "manageSettings" | "superAdmin";

export interface RbacCollectionPermissions {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
  publish?: boolean;
}

export interface RbacPermissions {
  collections: Record<string, RbacCollectionPermissions>;
  system: Partial<Record<RbacSystemAction, boolean>>;
}

export interface RbacRole {
  id: string;
  name: string;
  description?: string;
  permissions?: RbacPermissions;
}

export interface UserRoleAssignment {
  userId: string;
  roleIds: string[];
  grants: string[];
  updatedAt?: string;
}

export interface RbacApi {
  listRoles(): Promise<RbacRole[]>;
  getRole(id: string): Promise<RbacRole | null>;
  createRole(data: {
    name: string;
    description?: string;
    permissions?: RbacPermissions;
  }): Promise<string>;
  updateRole(
    id: string,
    data: { name?: string; description?: string; permissions?: RbacPermissions },
  ): Promise<void>;
  deleteRole(id: string): Promise<void>;
  getUserRoles(userId: string): Promise<UserRoleAssignment | null>;
  assignRoles(userId: string, roleIds: string[]): Promise<void>;
}

/** Identifies a versionable document: an entry in a content collection, or a global. */
export type VersionTarget =
  { kind: "entry"; collection: string; id: string } | { kind: "global"; slug: string };

export interface VersionRecord {
  id: string;
  /** Sequential version number, starting at 1. */
  number: number;
  /** Snapshot of the entry/global data at save time (excluding the id). */
  data: Record<string, unknown>;
  /** UID of the user who created the snapshot, if known. */
  author?: string;
  createdAt: string;
  /** Optional human-readable description of the change. */
  summary?: string;
  kind: "entry" | "global";
  parentId: string;
  parentType: string;
}

export interface VersionDiffEntry {
  field: string;
  before: unknown;
  after: unknown;
  changed: boolean;
}

export interface VersionPruneOptions {
  /** Keep at most this many newest versions. Defaults to 20. */
  keep?: number;
  /** Also delete kept-oldest versions older than this many days (TTL). */
  olderThanDays?: number;
}

export interface VersionsApi {
  /** Chronological versions, newest first. */
  list(target: VersionTarget, options?: { limit?: number }): Promise<VersionRecord[]>;
  get(target: VersionTarget, versionId: string): Promise<VersionRecord | null>;
  /** Field-level diff between two versions of the same target. */
  diff(target: VersionTarget, versionId: string, otherId: string): Promise<VersionDiffEntry[]>;
  /** Applies a version's data back to its document, snapshotting the current state first. */
  restore(target: VersionTarget, versionId: string): Promise<void>;
  remove(target: VersionTarget, versionId: string): Promise<void>;
  /** Deletes oldest versions beyond `keep`, optionally with an age-based TTL. Returns count removed. */
  prune(target: VersionTarget, options?: VersionPruneOptions): Promise<number>;
}

export interface WorkflowTransitionRecord {
  /** ISO timestamp of the transition. */
  at: string;
  /** State before the transition. */
  from: string;
  /** State after the transition. */
  to: string;
  /** UID of the user who performed the transition. */
  user?: string;
  /** Optional reviewer note attached to the transition. */
  comment?: string;
}

export interface WorkflowTransitionOptions {
  comment?: string;
  reviewer?: string;
}

export interface WorkflowApi {
  /** Moves an entry to a new workflow state, appending to its transition history. */
  transition(
    collection: string,
    id: string,
    to: string,
    options?: WorkflowTransitionOptions,
  ): Promise<void>;
  /** Assigns a reviewer (by user id) to an entry. */
  assignReviewer(collection: string, id: string, userId: string): Promise<void>;
  /** Chronological list of state transitions for an entry (newest first). */
  history(collection: string, id: string): Promise<WorkflowTransitionRecord[]>;
}

export interface NotificationRecord {
  id: string;
  /** UID of the user the notification belongs to. */
  userId: string;
  type: string;
  message: string;
  collection?: string;
  entryId?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsApi {
  /** Notifications for the signed-in user, newest first. */
  list(options?: { limit?: number }): Promise<NotificationRecord[]>;
  /** Marks the given notification ids as read. */
  markRead(ids: string[]): Promise<void>;
}
