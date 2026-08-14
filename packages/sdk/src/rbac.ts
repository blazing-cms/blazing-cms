import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";

import type { RbacApi, RbacRole, UserRoleAssignment } from "./types.js";

export const ROLES_COLLECTION = "collections_roles";
export const USER_ROLES_COLLECTION = "collections_user_roles";

const RBAC_ACTIONS = ["create", "read", "update", "delete", "publish"] as const;
export const SYSTEM_ACTIONS = [
  "manageUsers",
  "manageRoles",
  "manageMedia",
  "manageSettings",
] as const;

const SUPER_ADMIN_GRANT = "*:*";

function normalizedRaw(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

export function expandPermissions(permissions: unknown): string[] {
  const source = normalizedRaw(permissions);
  const system = normalizedRaw(source.system);
  const grants = new Set<string>(systemGrants(system));
  for (const grant of collectionGrants(normalizedRaw(source.collections))) grants.add(grant);
  return [...grants].sort();
}

function systemGrants(system: Record<string, unknown>): string[] {
  const grants = SYSTEM_ACTIONS.filter((action) => system[action] === true).map(
    (action) => `system:${action}`,
  );
  if (system.superAdmin === true) grants.push(SUPER_ADMIN_GRANT);
  return grants;
}

function collectionGrants(collections: Record<string, unknown>): string[] {
  return Object.entries(collections).flatMap(([slug, rawFlags]) => {
    const flags = normalizedRaw(rawFlags);
    return RBAC_ACTIONS.filter((action) => flags[action] === true).map(
      (action) => `collections:${slug}:${action}`,
    );
  });
}

export function mergeGrants(...lists: string[][]): string[] {
  const merged = new Set<string>();
  for (const list of lists) {
    for (const grant of list) merged.add(grant);
  }
  return [...merged].sort();
}

function roleFromSnapshot(d: { id: string; data(): unknown }): RbacRole {
  const raw = normalizedRaw(d.data());
  return {
    description: typeof raw.description === "string" ? raw.description : undefined,
    id: d.id,
    name: typeof raw.name === "string" ? raw.name : "",
    permissions: raw.permissions as RbacRole["permissions"],
  };
}

export function createRbacApi(db: Firestore): RbacApi {
  const rolesRef = collection(db, ROLES_COLLECTION);
  const userRolesRef = collection(db, USER_ROLES_COLLECTION);

  async function grantsForRoleIds(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return [];
    const snap = await getDocs(rolesRef);
    const grants = snap.docs
      .filter((d) => roleIds.includes(d.id))
      .flatMap((d) => expandPermissions(d.data().permissions));
    return mergeGrants(grants);
  }

  return {
    async assignRoles(userId: string, roleIds: string[]): Promise<void> {
      const grants = await grantsForRoleIds(roleIds);
      const assignment: UserRoleAssignment = {
        grants,
        roleIds,
        updatedAt: new Date().toISOString(),
        userId,
      };
      await setDoc(doc(userRolesRef, userId), assignment, { merge: true });
    },

    async createRole(data: {
      name: string;
      description?: string;
      permissions?: RbacRole["permissions"];
    }): Promise<string> {
      const ref = await addDoc(rolesRef, data);
      return ref.id;
    },

    async deleteRole(id: string): Promise<void> {
      await deleteDoc(doc(db, ROLES_COLLECTION, id));
    },

    async getRole(id: string): Promise<RbacRole | null> {
      const snap = await getDoc(doc(db, ROLES_COLLECTION, id));
      if (!snap.exists()) return null;
      return roleFromSnapshot(snap);
    },

    async getUserRoles(userId: string): Promise<UserRoleAssignment | null> {
      const snap = await getDoc(doc(db, USER_ROLES_COLLECTION, userId));
      if (!snap.exists()) return null;
      return { userId: snap.id, ...snap.data() } as UserRoleAssignment;
    },

    async listRoles(): Promise<RbacRole[]> {
      const snap = await getDocs(rolesRef);
      return snap.docs.map(roleFromSnapshot);
    },

    async updateRole(
      id: string,
      data: { name?: string; description?: string; permissions?: RbacRole["permissions"] },
    ): Promise<void> {
      await updateDoc(doc(db, ROLES_COLLECTION, id), data);
    },
  };
}
