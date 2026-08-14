import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  type DocumentSnapshot,
  type Firestore,
} from "firebase/firestore";

import type { NotificationRecord, NotificationsApi } from "./types.js";

export const NOTIFICATIONS_COLLECTION = "notifications";

function currentUid(db: Firestore): string | undefined {
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

function notificationFromSnapshot(d: DocumentSnapshot): NotificationRecord {
  const raw = d.data() ?? {};
  return {
    collection: stringOrUndefined(raw.collection),
    createdAt: stringField(raw.createdAt),
    entryId: stringOrUndefined(raw.entryId),
    id: d.id,
    message: stringField(raw.message),
    read: raw.read === true,
    type: stringField(raw.type),
    userId: stringField(raw.userId),
  };
}

function sortNewest(records: NotificationRecord[]): NotificationRecord[] {
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createNotificationsApi(db: Firestore): NotificationsApi {
  return {
    async list(options) {
      const uid = currentUid(db);
      if (!uid) return [];
      const snap = await getDocs(
        query(
          collection(db, NOTIFICATIONS_COLLECTION),
          where("userId", "==", uid),
          limit(options?.limit ?? 50),
        ),
      );
      return sortNewest(snap.docs.map(notificationFromSnapshot));
    },

    async markRead(ids: string[]): Promise<void> {
      await Promise.all(
        ids.map((id) => updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true })),
      );
    },
  };
}
