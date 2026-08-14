import { getAuth } from "firebase/auth";
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
  type DocumentSnapshot,
  type Firestore,
} from "firebase/firestore";

import type {
  VersionDiffEntry,
  VersionPruneOptions,
  VersionRecord,
  VersionTarget,
  VersionsApi,
} from "./types.js";

export const DEFAULT_KEEP = 20;

interface TargetRef {
  kind: "entry" | "global";
  parentId: string;
  parentType: string;
  parentRef: ReturnType<typeof doc>;
  versionsPath: string;
}

function targetRef(db: Firestore, target: VersionTarget): TargetRef {
  if (target.kind === "entry") {
    return {
      kind: "entry",
      parentId: target.id,
      parentRef: doc(db, target.collection, target.id),
      parentType: target.collection,
      versionsPath: `${target.collection}/${target.id}/versions`,
    };
  }
  return {
    kind: "global",
    parentId: "value",
    parentRef: doc(db, `globals_${target.slug}`, "value"),
    parentType: `globals_${target.slug}`,
    versionsPath: `globals_${target.slug}/value/versions`,
  };
}

function currentAuthor(db: Firestore): string | undefined {
  try {
    return getAuth(db.app).currentUser?.uid;
  } catch {
    return undefined;
  }
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function stringField(value: unknown): string {
  return String(value ?? "");
}

function numberField(value: unknown): number {
  return Number(value ?? 0);
}

function kindField(value: unknown): VersionRecord["kind"] {
  return value === "global" ? "global" : "entry";
}

function dataField(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function versionFromSnapshot(d: DocumentSnapshot): VersionRecord {
  const raw = d.data() ?? {};
  return {
    author: stringOrUndefined(raw.author),
    createdAt: stringField(raw.createdAt),
    data: dataField(raw.data),
    id: d.id,
    kind: kindField(raw.kind),
    number: numberField(raw.number),
    parentId: stringField(raw.parentId),
    parentType: stringField(raw.parentType),
    summary: stringOrUndefined(raw.summary),
  };
}

async function nextVersionNumber(db: Firestore, versionsPath: string): Promise<number> {
  const snap = await getDocs(
    query(collection(db, versionsPath), orderBy("number", "desc"), limit(1)),
  );
  if (snap.docs.length === 0) return 1;
  return Number(snap.docs.at(0)?.data().number ?? 0) + 1;
}

/** Saves the current state of a document as a new version snapshot. */
export async function snapshotVersion(
  db: Firestore,
  target: VersionTarget,
  summary?: string,
): Promise<void> {
  const ref = targetRef(db, target);
  const snap = await getDoc(ref.parentRef);
  if (!snap.exists()) return;
  await addDoc(collection(db, ref.versionsPath), {
    author: currentAuthor(db),
    createdAt: new Date().toISOString(),
    data: snap.data(),
    kind: ref.kind,
    number: await nextVersionNumber(db, ref.versionsPath),
    parentId: ref.parentId,
    parentType: ref.parentType,
    summary,
  });
}

/** Deletes the oldest versions beyond `keep` (count-based pruning). */
export async function enforceKeep(
  db: Firestore,
  versionsPath: string,
  keep: number,
): Promise<number> {
  const snap = await getDocs(query(collection(db, versionsPath), orderBy("number", "desc")));
  const toDelete = snap.docs.slice(keep);
  for (const d of toDelete) await deleteDoc(doc(db, versionsPath, d.id));
  return toDelete.length;
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

async function getVersion(db: Firestore, target: VersionTarget, versionId: string) {
  const ref = targetRef(db, target);
  const snap = await getDoc(doc(db, ref.versionsPath, versionId));
  return snap.exists() ? versionFromSnapshot(snap) : null;
}

function isTimestamp(value: unknown): value is { seconds: number } {
  return value !== null && typeof value === "object" && "seconds" in value;
}

function isOlderThan(createdAt: unknown, cutoff: number): boolean {
  if (isTimestamp(createdAt)) return createdAt.seconds * 1000 < cutoff;
  return new Date(String(createdAt ?? "")).getTime() < cutoff;
}

function keepCount(options?: VersionPruneOptions): number {
  return options?.keep ?? DEFAULT_KEEP;
}

function ttlCutoff(olderThanDays: number): number {
  return Date.now() - olderThanDays * 86_400_000;
}

async function prune(db: Firestore, target: VersionTarget, options?: VersionPruneOptions) {
  const ref = targetRef(db, target);
  const snap = await getDocs(query(collection(db, ref.versionsPath), orderBy("number", "desc")));
  let toDelete = snap.docs.slice(keepCount(options));
  if (options?.olderThanDays !== undefined) {
    const cutoff = ttlCutoff(options.olderThanDays);
    toDelete = toDelete.filter((d) => isOlderThan(d.data().createdAt, cutoff));
  }
  for (const d of toDelete) await deleteDoc(doc(db, ref.versionsPath, d.id));
  return toDelete.length;
}

export function createVersionsApi(db: Firestore): VersionsApi {
  return {
    async diff(target, versionId, otherId) {
      const a = await getVersion(db, target, versionId);
      const b = await getVersion(db, target, otherId);
      if (!a || !b) throw new Error(`Version not found`);
      return diffVersionData(a.data, b.data);
    },

    async get(target, versionId) {
      return getVersion(db, target, versionId);
    },

    async list(target, options) {
      const ref = targetRef(db, target);
      const snap = await getDocs(
        query(
          collection(db, ref.versionsPath),
          orderBy("number", "desc"),
          limit(options?.limit ?? 50),
        ),
      );
      return snap.docs.map(versionFromSnapshot);
    },

    async prune(target, options) {
      return prune(db, target, options);
    },

    async remove(target, versionId) {
      const ref = targetRef(db, target);
      await deleteDoc(doc(db, ref.versionsPath, versionId));
    },

    async restore(target, versionId) {
      const ref = targetRef(db, target);
      const version = await getVersion(db, target, versionId);
      if (!version) throw new Error(`Version not found: ${versionId}`);
      await snapshotVersion(db, target, `Restored to version ${version.number}`);
      await setDoc(ref.parentRef, version.data, { merge: true });
    },
  };
}
