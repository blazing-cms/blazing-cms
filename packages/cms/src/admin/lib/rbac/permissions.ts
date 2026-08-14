import {
  ALL_COLLECTIONS,
  COLLECTION_ACTIONS,
  SUPER_ADMIN_GRANT,
  SYSTEM_ACTIONS,
  type CollectionAction,
  type CollectionPermissionFlags,
  type RolePermissions,
  type SystemPermissionFlags,
  type UserRolesRecord,
} from "./types";

export function emptyPermissions(): RolePermissions {
  return { collections: {}, system: {} };
}

function collectionGrant(action: string, slug: string): string {
  return `collections:${slug}:${action}`;
}

function systemGrant(action: string): string {
  return `system:${action}`;
}

function normalizedRaw(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function normalizeCollectionFlags(raw: unknown): CollectionPermissionFlags {
  const source = normalizedRaw(raw);
  const flags: CollectionPermissionFlags = {};
  for (const action of COLLECTION_ACTIONS) {
    if (source[action] === true) flags[action] = true;
  }
  return flags;
}

export function normalizePermissions(raw: unknown): RolePermissions {
  const source = normalizedRaw(raw);
  const collections: Record<string, CollectionPermissionFlags> = {};
  const rawCollections = normalizedRaw(source.collections);
  for (const [slug, flags] of Object.entries(rawCollections)) {
    const normalized = normalizeCollectionFlags(flags);
    if (Object.keys(normalized).length > 0) collections[slug] = normalized;
  }
  const system: SystemPermissionFlags = {};
  const rawSystem = normalizedRaw(source.system);
  for (const action of [...SYSTEM_ACTIONS, "superAdmin"] as const) {
    if (rawSystem[action] === true) system[action] = true;
  }
  return { collections, system };
}

export function expandRolePermissions(permissions: RolePermissions): string[] {
  const grants = new Set<string>();
  if (permissions.system.superAdmin) grants.add(SUPER_ADMIN_GRANT);
  for (const [slug, flags] of Object.entries(permissions.collections)) {
    for (const action of COLLECTION_ACTIONS) {
      if (flags[action]) grants.add(collectionGrant(action, slug));
    }
  }
  for (const action of SYSTEM_ACTIONS) {
    if (permissions.system[action]) grants.add(systemGrant(action));
  }
  return [...grants].sort();
}

export function mergeGrants(...lists: string[][]): string[] {
  const merged = new Set<string>();
  for (const list of lists) {
    for (const grant of list) merged.add(grant);
  }
  return [...merged].sort();
}

export function bootstrapAdminGrants(roles: unknown[]): string[] {
  return roles.length === 0 ? [SUPER_ADMIN_GRANT] : [];
}

export function hasGrant(grants: string[], action: string, resource: string): boolean {
  if (grants.includes(SUPER_ADMIN_GRANT)) return true;
  if (grants.includes(collectionGrant(action, resource))) return true;
  return grants.includes(collectionGrant(action, ALL_COLLECTIONS));
}

export function hasSystemGrant(grants: string[], action: string): boolean {
  if (grants.includes(SUPER_ADMIN_GRANT)) return true;
  return grants.includes(systemGrant(action));
}

export function hasCollectionPermission(
  permissions: RolePermissions,
  slug: string,
  action: CollectionAction,
): boolean {
  if (permissions.system.superAdmin) return true;
  if (permissions.collections[slug]?.[action]) return true;
  return permissions.collections[ALL_COLLECTIONS]?.[action] ?? false;
}

export function setCollectionAction(
  permissions: RolePermissions,
  slug: string,
  action: CollectionAction,
  value: boolean,
): RolePermissions {
  const flags = { ...permissions.collections[slug] };
  const { [action]: _removedAction, ...restFlags } = flags;
  const nextFlags = value ? { ...restFlags, [action]: true } : restFlags;
  const { [slug]: _removedSlug, ...restCollections } = permissions.collections;
  const collections =
    Object.keys(nextFlags).length > 0 ? { ...restCollections, [slug]: nextFlags } : restCollections;
  return { ...permissions, collections };
}

export function setSystemFlag(
  permissions: RolePermissions,
  key: keyof SystemPermissionFlags,
  value: boolean,
): RolePermissions {
  const { [key]: _removed, ...rest } = permissions.system;
  const system = value ? { ...rest, [key]: true } : rest;
  return { ...permissions, system };
}

export function legacyRoleIds(userRecord: Record<string, unknown>): string[] {
  const role = userRecord.role;
  if (typeof role === "string") return role.length > 0 ? [role] : [];
  if (Array.isArray(role)) return role.filter((r): r is string => typeof r === "string");
  return [];
}

export function resolveRoleIds(
  roleIds: string[],
  roles: Array<{ id: string; name: string }>,
): string[] {
  const byId = roles.filter((role) => roleIds.includes(role.id)).map((role) => role.id);
  const byName = roles.filter((role) => roleIds.includes(role.name)).map((role) => role.id);
  return [...new Set([...byId, ...byName])];
}

export function resolveUserGrants(
  userRoles: { roleIds: string[] },
  roles: Array<{ id: string; permissions?: unknown }>,
): string[] {
  const grants: string[] = [];
  for (const role of roles) {
    if (!userRoles.roleIds.includes(role.id)) continue;
    grants.push(...expandRolePermissions(normalizePermissions(role.permissions)));
  }
  return mergeGrants(grants);
}

export function rolesOverlap(userRoleIds: string[], allowedRoles?: string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((roleId) => userRoleIds.includes(roleId));
}

export function roleIdsFromRecords(
  userRoles: unknown,
  userRecord: unknown,
  roles: Array<{ id: string; name: string }>,
): string[] {
  const rolesRecord = (userRoles ?? null) as UserRolesRecord | null;
  if (rolesRecord && Array.isArray(rolesRecord.roleIds)) return rolesRecord.roleIds;
  if (!userRecord) return [];
  return resolveRoleIds(legacyRoleIds(userRecord as Record<string, unknown>), roles);
}
