import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDoc, updateDoc, type Firestore } from "firebase/firestore";

import type { WorkflowApi, WorkflowTransitionOptions, WorkflowTransitionRecord } from "./types.js";

function workflowStateOf(data: Record<string, unknown>): string {
  return typeof data.workflowState === "string" ? data.workflowState : "draft";
}

function isTransitionRecord(value: unknown): value is WorkflowTransitionRecord {
  return value !== null && typeof value === "object" && "from" in value && "to" in value;
}

function historyOf(value: unknown): WorkflowTransitionRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTransitionRecord);
}

function currentAuthor(db: Firestore): string | undefined {
  try {
    return getAuth(db.app).currentUser?.uid;
  } catch {
    return undefined;
  }
}

function transitionRecord(
  data: Record<string, unknown>,
  to: string,
  options: WorkflowTransitionOptions | undefined,
  user: string | undefined,
): WorkflowTransitionRecord {
  return {
    at: new Date().toISOString(),
    comment: options?.comment,
    from: workflowStateOf(data),
    to,
    user,
  };
}

function transitionPatch(
  data: Record<string, unknown>,
  to: string,
  options: WorkflowTransitionOptions | undefined,
  user: string | undefined,
): Record<string, unknown> {
  return {
    reviewer: options?.reviewer ?? data.reviewer ?? null,
    workflowHistory: [
      ...historyOf(data.workflowHistory),
      transitionRecord(data, to, options, user),
    ],
    workflowState: to,
  };
}

async function notifyReviewer(
  db: Firestore,
  collectionName: string,
  entryId: string,
  userId: string,
): Promise<void> {
  try {
    await addDoc(collection(db, "notifications"), {
      collection: collectionName,
      createdAt: new Date().toISOString(),
      entryId,
      message: `You have been assigned to review a ${collectionName} entry`,
      read: false,
      type: "workflow-review",
      userId,
    });
  } catch {
    // Notifications are best-effort and must never break a transition.
  }
}

export function createWorkflowApi(db: Firestore): WorkflowApi {
  return {
    async assignReviewer(collectionName: string, id: string, userId: string): Promise<void> {
      await updateDoc(doc(db, collectionName, id), { reviewer: userId });
    },

    async history(collectionName: string, id: string): Promise<WorkflowTransitionRecord[]> {
      const snap = await getDoc(doc(db, collectionName, id));
      if (!snap.exists()) return [];
      return historyOf(snap.data()?.workflowHistory);
    },

    async transition(
      collectionName: string,
      id: string,
      to: string,
      options?: WorkflowTransitionOptions,
    ): Promise<void> {
      const snap = await getDoc(doc(db, collectionName, id));
      if (!snap.exists()) throw new Error(`Entry not found: ${id}`);
      const data = snap.data() ?? {};
      await updateDoc(
        doc(db, collectionName, id),
        transitionPatch(data, to, options, currentAuthor(db)),
      );
      if (options?.reviewer) await notifyReviewer(db, collectionName, id, options.reviewer);
    },
  };
}
