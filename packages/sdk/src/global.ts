import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";

import type { GlobalApi } from "./types.js";

import { snapshotVersion } from "./versions.js";

export function createGlobalApi(db: Firestore): GlobalApi {
  return {
    async get(slug: string) {
      const snap = await getDoc(doc(db, `globals_${slug}`, "value"));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Record<string, unknown>;
    },

    async upsert(slug: string, data: Record<string, unknown>) {
      await snapshotVersion(db, { kind: "global", slug }, "Saved");
      await setDoc(doc(db, `globals_${slug}`, "value"), data, { merge: true });
    },
  };
}
