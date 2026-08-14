import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
} from "firebase/storage";

import type {
  MediaApi,
  MediaConfig,
  MediaFolder,
  MediaItem,
  MediaQueryOptions,
  MediaUploadOptions,
} from "./types.js";

const MEDIA_COLLECTION = "collections_media";
const FOLDERS_COLLECTION = "media_folders";
const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024;
const LIST_LIMIT = 100;
const ALLOWED_MIME =
  /^(image\/(?:jpeg|png|webp|gif|svg\+xml|avif)|video\/(?:mp4|webm)|application\/pdf)$/;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalStr(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNum(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function num(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function optionalStrOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function mediaItemFromData(data: Record<string, unknown>): MediaItem {
  return {
    altText: optionalStr(data.altText),
    caption: optionalStr(data.caption),
    createdAt: str(data.createdAt),
    createdBy: optionalStr(data.createdBy),
    folder: optionalStrOrNull(data.folder),
    height: optionalNum(data.height),
    id: str(data.id),
    mimeType: str(data.mimeType),
    name: str(data.name),
    size: num(data.size),
    storagePath: str(data.storagePath),
    tags: strArray(data.tags),
    updatedAt: str(data.updatedAt),
    url: str(data.url),
    width: optionalNum(data.width),
  };
}

export function validateMediaFile(file: File, maxFileSize = DEFAULT_MAX_FILE_SIZE): void {
  if (file.size > maxFileSize) {
    throw new Error(`File exceeds the ${Math.round(maxFileSize / 1048576)}MB upload limit.`);
  }
  if (!ALLOWED_MIME.test(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }
}

export function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function measureImage(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith("image/")) return {};
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { height: bitmap.height, width: bitmap.width };
    bitmap.close();
    return dims;
  } catch {
    return {};
  }
}

function objectReferences(data: unknown, target: string): boolean {
  if (data && typeof data === "object") {
    return Object.values(data).some((value) => referencesValue(value, target));
  }
  return false;
}

export function referencesValue(data: unknown, target: string): boolean {
  if (typeof data === "string") return data.includes(target);
  if (Array.isArray(data)) return data.some((item) => referencesValue(item, target));
  return objectReferences(data, target);
}

function folderFilter(value: string | null | undefined): QueryFilter | undefined {
  if (value === undefined) return undefined;
  return where("folder", "==", value);
}

type QueryFilter = ReturnType<typeof where>;

function matchesSearch(item: MediaItem, term: string): boolean {
  const q = term.toLowerCase();
  const candidates = [item.name, item.altText ?? "", item.caption ?? "", ...item.tags];
  return candidates.some((value) => value.toLowerCase().includes(q));
}

async function uploadToStorage(
  storage: FirebaseStorage,
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, {
    cacheControl: "public, max-age=31536000, immutable",
    contentType: file.type,
  });
  if (onProgress) {
    task.on("state_changed", (snap: { bytesTransferred: number; totalBytes: number }) => {
      const total = snap.totalBytes || 1;
      onProgress(Math.round((snap.bytesTransferred / total) * 100));
    });
  }
  await task;
  return getDownloadURL(storageRef);
}

function collectFilters(options: MediaQueryOptions): QueryFilter[] {
  const filters: QueryFilter[] = [];
  const folder = folderFilter(options.folder);
  if (folder) filters.push(folder);
  if (options.tag) filters.push(where("tags", "array-contains", options.tag));
  return filters;
}

function filterSearch(items: MediaItem[], search?: string): MediaItem[] {
  if (!search) return items;
  return items.filter((item) => matchesSearch(item, search));
}

async function listMedia(db: Firestore, options: MediaQueryOptions = {}): Promise<MediaItem[]> {
  const q = query(
    collection(db, MEDIA_COLLECTION),
    ...collectFilters(options),
    orderBy("createdAt", "desc"),
    limit(options.limit ?? LIST_LIMIT),
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => mediaItemFromData({ id: d.id, ...d.data() }));
  return filterSearch(items, options.search);
}

async function getMedia(db: Firestore, id: string): Promise<MediaItem | null> {
  const snap = await getDoc(doc(db, MEDIA_COLLECTION, id));
  if (!snap.exists()) return null;
  return mediaItemFromData({ id: snap.id, ...snap.data() });
}

function pick<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

function uploadData(
  file: File,
  url: string,
  storagePath: string,
  options: MediaUploadOptions,
  dims: { height?: number; width?: number },
  now: string,
): Record<string, unknown> {
  return {
    altText: pick(options.altText, ""),
    caption: pick(options.caption, ""),
    createdAt: now,
    folder: pick(options.folder, null),
    ...dims,
    mimeType: file.type,
    name: file.name,
    size: file.size,
    storagePath,
    tags: pick(options.tags, []),
    updatedAt: now,
    url,
  };
}

async function uploadMedia(
  db: Firestore,
  storage: FirebaseStorage,
  maxFileSize: number,
  file: File,
  options: MediaUploadOptions = {},
): Promise<MediaItem> {
  validateMediaFile(file, maxFileSize);
  const docRef = doc(collection(db, MEDIA_COLLECTION));
  const storagePath = `media/${docRef.id}/${safeFileName(file.name)}`;
  const url = await uploadToStorage(storage, storagePath, file, options.onProgress);
  const dims = await measureImage(file);
  const data = uploadData(file, url, storagePath, options, dims, new Date().toISOString());
  await setDoc(docRef, data);
  return mediaItemFromData({ id: docRef.id, ...data });
}

async function updateMedia(
  db: Firestore,
  id: string,
  data: Partial<Pick<MediaItem, "altText" | "caption" | "folder" | "name" | "tags">>,
): Promise<void> {
  await updateDoc(doc(db, MEDIA_COLLECTION, id), { ...data, updatedAt: new Date().toISOString() });
}

async function replaceMedia(
  db: Firestore,
  storage: FirebaseStorage,
  maxFileSize: number,
  id: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<MediaItem> {
  validateMediaFile(file, maxFileSize);
  const existing = await getMedia(db, id);
  if (!existing) throw new Error(`Media not found: ${id}`);
  const storagePath = `media/${id}/${safeFileName(file.name)}`;
  const url = await uploadToStorage(storage, storagePath, file, onProgress);
  const dims = await measureImage(file);
  const data = {
    ...dims,
    mimeType: file.type,
    name: file.name,
    size: file.size,
    storagePath,
    updatedAt: new Date().toISOString(),
    url,
  };
  await updateDoc(doc(db, MEDIA_COLLECTION, id), data);
  return mediaItemFromData({ ...existing, ...data });
}

async function removeMedia(db: Firestore, storage: FirebaseStorage, id: string): Promise<void> {
  const existing = await getMedia(db, id);
  if (existing?.storagePath) {
    try {
      await deleteObject(ref(storage, existing.storagePath));
    } catch {
      // object may already be gone — deletion of the record proceeds
    }
  }
  await deleteDoc(doc(db, MEDIA_COLLECTION, id));
}

async function countReferences(db: Firestore, slug: string, id: string): Promise<number> {
  const snap = await getDocs(query(collection(db, `collections_${slug}`), limit(LIST_LIMIT)));
  let count = 0;
  for (const d of snap.docs) {
    if (referencesValue(d.data(), id)) count += 1;
  }
  return count;
}

async function findMediaUsage(
  db: Firestore,
  id: string,
  collections: string[],
): Promise<Array<{ collection: string; count: number }>> {
  const results: Array<{ collection: string; count: number }> = [];
  for (const slug of collections) {
    const count = await countReferences(db, slug, id);
    if (count > 0) results.push({ collection: slug, count });
  }
  return results;
}

async function listFolders(db: Firestore): Promise<MediaFolder[]> {
  const snap = await getDocs(query(collection(db, FOLDERS_COLLECTION), orderBy("name", "asc")));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
      id: d.id,
      name: typeof data.name === "string" ? data.name : "",
      parent: typeof data.parent === "string" ? data.parent : null,
    };
  });
}

async function createFolder(
  db: Firestore,
  name: string,
  parent: string | null = null,
): Promise<MediaFolder> {
  const ref = await addDoc(collection(db, FOLDERS_COLLECTION), {
    createdAt: new Date().toISOString(),
    name,
    parent,
  });
  return { createdAt: new Date().toISOString(), id: ref.id, name, parent };
}

async function renameFolder(db: Firestore, id: string, name: string): Promise<void> {
  await updateDoc(doc(db, FOLDERS_COLLECTION, id), {
    name,
    updatedAt: new Date().toISOString(),
  });
}

async function removeFolder(db: Firestore, id: string): Promise<void> {
  const batch = writeBatch(db);
  const media = await getDocs(query(collection(db, MEDIA_COLLECTION), where("folder", "==", id)));
  for (const item of media.docs) {
    batch.update(item.ref, { folder: null });
  }
  batch.delete(doc(db, FOLDERS_COLLECTION, id));
  await batch.commit();
}

export function createMediaApi(
  db: Firestore,
  storage: FirebaseStorage,
  config: MediaConfig = {},
): MediaApi {
  const maxFileSize = config.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  return {
    folders: {
      create: (name, parent) => createFolder(db, name, parent),
      list: () => listFolders(db),
      remove: (id) => removeFolder(db, id),
      rename: (id, name) => renameFolder(db, id, name),
    },
    get: (id) => getMedia(db, id),
    list: (options) => listMedia(db, options),
    remove: (id) => removeMedia(db, storage, id),
    replace: (id, file, onProgress) => replaceMedia(db, storage, maxFileSize, id, file, onProgress),
    update: (id, data) => updateMedia(db, id, data),
    upload: (file, options) => uploadMedia(db, storage, maxFileSize, file, options),
    usage: (id, collections) => findMediaUsage(db, id, collections),
  };
}
