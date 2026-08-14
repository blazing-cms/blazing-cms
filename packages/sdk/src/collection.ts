import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type Firestore,
  type DocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";

import type { CollectionApi, QueryOptions, PaginatedResult } from "./types.js";

import { snapshotVersion } from "./versions.js";

const PAGE_SIZE = 25;

function docToData(d: DocumentSnapshot): Record<string, unknown> | null {
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Record<string, unknown>;
}

export function createCollectionApi(db: Firestore, collectionName: string): CollectionApi {
  const colRef = collection(db, collectionName);

  return {
    async create(data: Record<string, unknown>): Promise<string> {
      if (data.id) {
        await setDoc(doc(colRef, data.id as string), data);
        return data.id as string;
      }
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    },

    async delete(id: string): Promise<void> {
      await deleteDoc(doc(db, collectionName, id));
    },

    async findById(id: string): Promise<Record<string, unknown> | null> {
      const snap = await getDoc(doc(db, collectionName, id));
      return docToData(snap);
    },

    async findMany(options?: QueryOptions): Promise<PaginatedResult> {
      const constraints: QueryConstraint[] = [];
      const pageSize = options?.limit ?? PAGE_SIZE;

      if (options?.filters) {
        for (const f of options.filters) {
          constraints.push(where(f.field, f.op, f.value));
        }
      }

      if (options?.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction ?? "asc"));
      }

      constraints.push(limit(pageSize + 1));

      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      const docs = snap.docs.map(docToData).filter(Boolean) as Record<string, unknown>[];
      const hasMore = docs.length > pageSize;
      if (hasMore) docs.pop();

      return {
        cursor: hasMore ? snap.docs[pageSize - 1]?.id : undefined,
        data: docs,
        hasMore,
      };
    },

    async update(id: string, data: Record<string, unknown>): Promise<void> {
      const { id: _, ...updateData } = data;
      await snapshotVersion(db, { collection: collectionName, id, kind: "entry" }, "Edited");
      await updateDoc(doc(db, collectionName, id), updateData);
    },
  };
}
