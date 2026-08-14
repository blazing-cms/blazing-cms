import type { DataProvider } from "@/lib/providers/types";

import type { UserRolesRecord } from "./types";

import { expandRolePermissions, mergeGrants, normalizePermissions } from "./permissions";

async function grantsForRoleIds(provider: DataProvider, roleIds: string[]): Promise<string[]> {
  if (roleIds.length === 0) return [];
  const result = await provider.findMany("roles", { limit: 100 });
  const grants = result.data
    .filter((role) => roleIds.includes(role.id as string))
    .flatMap((role) => expandRolePermissions(normalizePermissions(role.permissions)));
  return mergeGrants(grants);
}

export async function saveUserRoles(
  provider: DataProvider,
  userId: string,
  roleIds: string[],
): Promise<void> {
  const grants = await grantsForRoleIds(provider, roleIds);
  const doc: UserRolesRecord = {
    grants,
    roleIds,
    updatedAt: new Date().toISOString(),
    userId,
  };
  const existing = await provider.findOne("user_roles", userId);
  if (existing) {
    await provider.update("user_roles", userId, doc as unknown as Record<string, unknown>);
  } else {
    await provider.create("user_roles", { id: userId, ...doc } as Record<string, unknown>);
  }
}
