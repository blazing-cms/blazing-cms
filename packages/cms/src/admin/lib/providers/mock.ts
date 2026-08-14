import { measureImage, pick, validateMediaFile } from "@/lib/media/validation";
import {
  emptyPermissions,
  expandRolePermissions,
  mergeGrants,
  setCollectionAction,
} from "@/lib/rbac/permissions";
import { historyOf, transitionRecord } from "@/lib/workflow";

import type {
  AnalyticsQuery,
  AnalyticsSummary,
  DataProvider,
  MediaUploadOptions,
  MediaUploadResult,
  NotificationRecord,
  PaginatedResult,
  QueryOptions,
  TransitionEntryOptions,
  VersionRecord,
  VersionTarget,
} from "./types";

import {
  aggregateAuthors,
  authorFields,
  bucketByDay,
  PERIOD_DAYS,
  sumMediaUsage,
  toISOString,
} from "./analytics-helpers";
import { isFilterValue } from "./types";

const MEDIA = "media";
const USERS = "users";
const ROLES = "roles";
const USER_ROLES = "user_roles";
const PAGE_SIZE = 25;

const store: Map<string, Map<string, Record<string, unknown>>> = new Map();
const globalStore: Map<string, Record<string, unknown>> = new Map();
const versionStore: Map<string, Map<string, VersionRecord>> = new Map();
const notificationStore: Map<string, NotificationRecord> = new Map();

function getCollection(col: string): Map<string, Record<string, unknown>> {
  if (!store.has(col)) store.set(col, new Map());
  return store.get(col) ?? new Map<string, Record<string, unknown>>();
}

function getVersions(target: VersionTarget): Map<string, VersionRecord> {
  const key =
    target.kind === "entry" ? `${target.collection}/${target.id}` : `global/${target.slug}`;
  if (!versionStore.has(key)) versionStore.set(key, new Map());
  return versionStore.get(key) ?? new Map<string, VersionRecord>();
}

function writeVersionSnapshot(target: VersionTarget, summary: string): void {
  const existing =
    target.kind === "entry"
      ? getCollection(target.collection).get(target.id)
      : globalStore.get(target.slug);
  if (!existing) return;
  const versions = getVersions(target);
  const numbers = [...versions.values()].map((v) => v.number);
  const number = numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  versions.set(`version-${number}`, {
    author: "mock-user",
    createdAt: new Date().toISOString(),
    data: { ...existing },
    id: `version-${number}`,
    number,
    summary,
  });
  const sorted = [...versions.values()].sort((a, b) => b.number - a.number);
  for (const record of sorted.slice(DEFAULT_VERSION_KEEP)) versions.delete(record.id);
}

const DEFAULT_VERSION_KEEP = 20;

function contentTypeFor(name: string): string {
  if (name.endsWith(".jpg")) return "image/jpeg";
  if (name.endsWith(".svg")) return "image/svg+xml";
  return "application/pdf";
}

function urlFor(name: string): string {
  if (name.endsWith(".jpg")) return `https://picsum.photos/seed/${name}/400/300`;
  return "https://example.com/docs/overview-deck.pdf";
}

function seedFolders(): void {
  const folders = getCollection("media_folders");
  const names = ["Brand", "Blog", "Heroes"];
  names.forEach((name) => {
    folders.set(name.toLowerCase(), {
      createdAt: new Date().toISOString(),
      id: name.toLowerCase(),
      name,
    });
  });
}

function seedRecord(
  seed: { altText: string; folder: string; name: string; tags: string[] },
  now: number,
  index: number,
): Record<string, unknown> {
  const isImage = seed.name.endsWith(".jpg");
  return {
    ...seed,
    contentType: contentTypeFor(seed.name),
    createdAt: new Date(now - index * 86_400_000).toISOString(),
    height: isImage ? 300 : null,
    size: 120_000 + index * 17_000,
    updatedAt: new Date(now - index * 86_400_000).toISOString(),
    url: urlFor(seed.name),
    width: isImage ? 400 : null,
  };
}

function seedMockMedia(): void {
  const media = getCollection(MEDIA);
  if (media.size > 0) return;
  seedFolders();

  const now = Date.now();
  const seeds = [
    {
      altText: "Blazing hero banner",
      folder: "heroes",
      name: "hero-banner.jpg",
      tags: ["hero", "landing"],
    },
    { altText: "Brand logo mark", folder: "brand", name: "logo-mark.svg", tags: ["brand"] },
    { altText: "Team photo", folder: "brand", name: "team-2026.jpg", tags: ["team", "brand"] },
    {
      altText: "Product shot on teal",
      folder: "blog",
      name: "product-teal.jpg",
      tags: ["product"],
    },
    {
      altText: "Company overview deck",
      folder: "brand",
      name: "overview-deck.pdf",
      tags: ["document", "brand"],
    },
    { altText: "Launch teaser", folder: "blog", name: "launch-teaser.jpg", tags: ["launch"] },
    { altText: "Office interior", folder: "heroes", name: "office.jpg", tags: ["culture"] },
    { altText: "Community meetup", folder: "blog", name: "meetup.jpg", tags: ["community"] },
  ];
  seeds.forEach((seed, index) => {
    const id = `seed-${index + 1}`;
    media.set(id, { ...seedRecord(seed, now, index), id, path: `media/${seed.name}` });
  });
}

seedMockMedia();

function seedMockRbac(): void {
  const roles = getCollection(ROLES);
  if (roles.size > 0) return;

  const admin = emptyPermissions();
  admin.system.superAdmin = true;
  roles.set("role-admin", {
    createdAt: new Date().toISOString(),
    description: "Full access to every resource.",
    id: "role-admin",
    name: "Admin",
    permissions: admin,
  });

  const editor = emptyPermissions();
  setCollectionAction(editor, "posts", "create", true);
  setCollectionAction(editor, "posts", "read", true);
  setCollectionAction(editor, "posts", "update", true);
  setCollectionAction(editor, "posts", "publish", true);
  roles.set("role-editor", {
    createdAt: new Date().toISOString(),
    description: "Write and publish posts.",
    id: "role-editor",
    name: "Editor",
    permissions: editor,
  });

  const viewer = emptyPermissions();
  setCollectionAction(viewer, "*", "read", true);
  roles.set("role-viewer", {
    createdAt: new Date().toISOString(),
    description: "Read-only access to content.",
    id: "role-viewer",
    name: "Viewer",
    permissions: viewer,
  });

  const users = getCollection(USERS);
  users.set("user-admin", {
    createdAt: new Date().toISOString(),
    email: "admin@example.com",
    id: "user-admin",
    name: "Admin User",
  });

  const userRoles = getCollection(USER_ROLES);
  userRoles.set("user-admin", {
    grants: mergeGrants(expandRolePermissions(admin)),
    roleIds: ["role-admin"],
    updatedAt: new Date().toISOString(),
    userId: "user-admin",
  });
}

seedMockRbac();

function seedMockNotifications(): void {
  if (notificationStore.size > 0) return;
  const now = new Date().toISOString();
  notificationStore.set("notif-1", {
    collection: "posts",
    createdAt: now,
    entryId: "seed-post-1",
    id: "notif-1",
    message: "A post has been submitted for your review.",
    read: false,
    type: "workflow-review",
    userId: "user-admin",
  });
}

seedMockNotifications();

function mockTransitionPatch(
  data: Record<string, unknown>,
  to: string,
  options?: TransitionEntryOptions,
): Record<string, unknown> {
  const record = transitionRecord(data.workflowState, to, {
    comment: options?.comment,
    user: "mock-user",
  });
  return {
    reviewer: options?.reviewer ?? data.reviewer ?? null,
    workflowHistory: [...historyOf(data.workflowHistory), record],
    workflowState: to,
  };
}

function mockNotifyReviewer(collectionName: string, entryId: string, userId: string): void {
  const id = `notif-${crypto.randomUUID()}`;
  notificationStore.set(id, {
    collection: collectionName,
    createdAt: new Date().toISOString(),
    entryId,
    id,
    message: `You have been assigned to review a ${collectionName} entry`,
    read: false,
    type: "workflow-review",
    userId,
  });
}

function mockNotificationsFor(userId: string): NotificationRecord[] {
  return [...notificationStore.values()]
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function pushEntryActivity(
  entries: Iterable<Record<string, unknown>>,
  startMs: number,
  allDates: string[],
  authors: string[],
): void {
  for (const entry of entries) {
    const createdAt = toISOString(entry.createdAt);
    if (createdAt && new Date(createdAt).getTime() >= startMs) allDates.push(createdAt);
    authors.push(...authorFields(entry));
  }
}

function collectEntries(
  collections: string[],
  startMs: number,
): {
  allDates: string[];
  authors: string[];
  byCollection: Array<{ slug: string; count: number }>;
  totalEntries: number;
} {
  const byCollection: Array<{ slug: string; count: number }> = [];
  let totalEntries = 0;
  const allDates: string[] = [];
  const authors: string[] = [];
  for (const slug of collections) {
    const entries = [...getCollection(slug).values()];
    byCollection.push({ count: entries.length, slug });
    totalEntries += entries.length;
    pushEntryActivity(entries, startMs, allDates, authors);
  }
  return { allDates, authors, byCollection, totalEntries };
}

async function getAnalytics(queryOpts: AnalyticsQuery): Promise<AnalyticsSummary> {
  const { collections, globals, period } = queryOpts;
  const startMs = Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;

  const { allDates, authors, byCollection, totalEntries } = collectEntries(collections, startMs);

  let totalGlobals = 0;
  for (const slug of globals) {
    if (globalStore.has(slug)) totalGlobals += 1;
  }

  const mediaRecords = [...getCollection(MEDIA).values()];
  const storage = sumMediaUsage(mediaRecords);

  return {
    activity: aggregateAuthors(authors),
    byCollection,
    changes: bucketByDay(allDates),
    counts: {
      totalCollections: collections.length,
      totalEntries,
      totalGlobals,
      totalMedia: getCollection(MEDIA).size,
      totalUsers: getCollection(USERS).size,
    },
    storage,
  };
}

type Matcher = (actual: unknown, value: unknown) => boolean;

const MATCHERS: Record<string, Matcher> = {
  "!=": (actual, value) => actual !== value,
  "<": (actual, value) => (actual as number) < (value as number),
  "<=": (actual, value) => (actual as number) <= (value as number),
  "==": (actual, value) => actual === value,
  ">": (actual, value) => (actual as number) > (value as number),
  ">=": (actual, value) => (actual as number) >= (value as number),
  "array-contains": (actual, value) => (actual as unknown[]).includes(value),
  "array-contains-any": (actual, value) =>
    (value as unknown[]).some((item) => (actual as unknown[]).includes(item)),
  in: (actual, value) => (value as unknown[]).includes(actual),
  "not-in": (actual, value) => !(value as unknown[]).includes(actual),
};

function matchesFilter(item: Record<string, unknown>, key: string, val: unknown): boolean {
  if (isFilterValue(val)) {
    const matcher = MATCHERS[val.op];
    if (matcher) return matcher(item[key], val.value);
    return true;
  }
  return item[key] === val;
}

function applyFilters(
  items: Array<Record<string, unknown>>,
  filter?: Record<string, unknown>,
): Array<Record<string, unknown>> {
  if (!filter) return items;
  for (const [key, val] of Object.entries(filter)) {
    items = items.filter((item) => matchesFilter(item, key, val));
  }
  return items;
}

function compareValues(a: unknown, b: unknown, dir: number): number {
  const av = a as string | number;
  const bv = b as string | number;
  if (av < bv) return dir;
  if (av > bv) return -dir;
  return 0;
}

function applySort(
  items: Array<Record<string, unknown>>,
  sort?: string,
  order?: "asc" | "desc",
): Array<Record<string, unknown>> {
  if (!sort) return items;
  const dir = order === "desc" ? 1 : -1;
  return [...items].sort((a, b) => compareValues(a[sort], b[sort], dir));
}

function limitSize(limit?: number): number {
  return limit === undefined ? PAGE_SIZE : limit;
}

function paginate<T>(items: T[], limit?: number): PaginatedResult<T> {
  const size = limitSize(limit);
  const hasMore = items.length > size;
  return { data: hasMore ? items.slice(0, size) : items, hasMore };
}

function mockMediaRecord(
  file: File,
  options: MediaUploadOptions,
  dims: { width?: number; height?: number },
  id: string,
  url: string,
): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    altText: pick(options.altText, file.name),
    caption: pick(options.caption, ""),
    contentType: file.type,
    createdAt: now,
    folder: pick(options.folder, null),
    height: dims.height === undefined ? null : dims.height,
    id,
    name: file.name,
    path: `media/${id}_${file.name}`,
    size: file.size,
    tags: pick(options.tags, []),
    updatedAt: now,
    url,
    width: dims.width === undefined ? null : dims.width,
  };
}

function mockPatch(
  existing: Record<string, unknown>,
  file: File,
  dims: { width?: number; height?: number },
  id: string,
  url: string,
  options: MediaUploadOptions,
): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    altText: pick(options.altText, pick(existing.altText as string, file.name)),
    caption: pick(options.caption, pick(existing.caption as string, "")),
    contentType: file.type,
    height: dims.height === undefined ? null : dims.height,
    name: file.name,
    path: `media/${id}_${file.name}`,
    size: file.size,
    tags: pick(options.tags, pick(existing.tags as string[], [])),
    updatedAt: now,
    url,
    width: dims.width === undefined ? null : dims.width,
  };
}

async function uploadMedia(file: File, options?: MediaUploadOptions): Promise<MediaUploadResult> {
  validateMediaFile(file);
  const dims = await measureImage(file);
  const id = crypto.randomUUID();
  const url = URL.createObjectURL(file);
  getCollection(MEDIA).set(id, mockMediaRecord(file, options ?? {}, dims, id, url));
  return { id, name: file.name, url };
}

export const mockProvider: DataProvider = {
  async assignReviewer(collectionName: string, id: string, userId: string) {
    const col = getCollection(collectionName);
    const existing = col.get(id);
    if (!existing) throw new Error(`Document ${id} not found in ${collectionName}`);
    col.set(id, { ...existing, reviewer: userId, updatedAt: new Date().toISOString() });
  },
  async create(collectionName: string, data: Record<string, unknown>) {
    const id = typeof data.id === "string" ? data.id : crypto.randomUUID();
    getCollection(collectionName).set(id, { ...data, id, updatedAt: new Date().toISOString() });
    return id;
  },

  async delete(collectionName: string, id: string) {
    getCollection(collectionName).delete(id);
  },

  async deleteMedia(id: string) {
    getCollection(MEDIA).delete(id);
  },

  async deleteVersion(target: VersionTarget, versionId: string) {
    getVersions(target).delete(versionId);
  },

  async findMany(collectionName: string, options?: QueryOptions) {
    const opts = options ?? {};
    const all = [...getCollection(collectionName).values()];
    const filtered = applyFilters(all, opts.filter);
    const sorted = applySort(filtered, opts.sort, opts.order);
    return paginate(sorted, opts.limit);
  },

  async findOne(collectionName: string, id: string) {
    return getCollection(collectionName).get(id) ?? null;
  },

  async getAnalytics(queryOpts: AnalyticsQuery) {
    return getAnalytics(queryOpts);
  },

  async getGlobal(slug: string) {
    return globalStore.get(slug) ?? null;
  },

  async getVersion(target: VersionTarget, versionId: string) {
    return getVersions(target).get(versionId) ?? null;
  },

  async listNotifications(userId: string) {
    return mockNotificationsFor(userId);
  },

  async listVersions(target: VersionTarget) {
    return [...getVersions(target).values()].sort((a, b) => b.number - a.number);
  },

  async markNotificationsRead(ids: string[]) {
    for (const nid of ids) {
      const existing = notificationStore.get(nid);
      if (existing) notificationStore.set(nid, { ...existing, read: true });
    }
  },

  name: "mock",

  async replaceMedia(id: string, file: File, options?: MediaUploadOptions) {
    validateMediaFile(file);
    const existing = getCollection(MEDIA).get(id);
    if (!existing) throw new Error(`Media item not found: ${id}`);
    const dims = await measureImage(file);
    const url = URL.createObjectURL(file);
    getCollection(MEDIA).set(id, {
      ...existing,
      ...mockPatch(existing, file, dims, id, url, options ?? {}),
    });
    return { url };
  },

  async restoreVersion(target: VersionTarget, versionId: string) {
    const version = getVersions(target).get(versionId);
    if (!version) throw new Error(`Version not found: ${versionId}`);
    writeVersionSnapshot(target, `Restored to version ${version.number}`);
    if (target.kind === "entry") {
      const col = getCollection(target.collection);
      const existing = col.get(target.id);
      col.set(target.id, { ...existing, ...version.data, updatedAt: new Date().toISOString() });
    } else {
      const existing = globalStore.get(target.slug) ?? {};
      globalStore.set(target.slug, {
        ...existing,
        ...version.data,
        updatedAt: new Date().toISOString(),
      });
    }
  },

  async transitionEntry(
    collectionName: string,
    id: string,
    to: string,
    options?: TransitionEntryOptions,
  ) {
    const col = getCollection(collectionName);
    const existing = col.get(id);
    if (!existing) throw new Error(`Document ${id} not found in ${collectionName}`);
    col.set(id, {
      ...existing,
      ...mockTransitionPatch(existing, to, options),
      updatedAt: new Date().toISOString(),
    });
    if (options?.reviewer) mockNotifyReviewer(collectionName, id, options.reviewer);
  },

  type: "mock",

  async update(collectionName: string, id: string, data: Record<string, unknown>) {
    const col = getCollection(collectionName);
    const existing = col.get(id);
    if (!existing) throw new Error(`Document ${id} not found in ${collectionName}`);
    writeVersionSnapshot({ collection: collectionName, id, kind: "entry" }, "Edited");
    const { id: _, ...rest } = data;
    col.set(id, { ...existing, ...rest, updatedAt: new Date().toISOString() });
  },

  async uploadMedia(file: File, options?: MediaUploadOptions) {
    return uploadMedia(file, options);
  },

  async upsertGlobal(slug: string, data: Record<string, unknown>) {
    writeVersionSnapshot({ kind: "global", slug }, "Saved");
    const existing = globalStore.get(slug) ?? {};
    globalStore.set(slug, { ...existing, ...data, updatedAt: new Date().toISOString() });
  },
};
