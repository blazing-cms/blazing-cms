export const COLLECTION_ACTIONS = ["create", "read", "update", "delete", "publish"] as const;
export type CollectionAction = (typeof COLLECTION_ACTIONS)[number];

export const SYSTEM_ACTIONS = [
  "manageUsers",
  "manageRoles",
  "manageMedia",
  "manageSettings",
] as const;
type SystemAction = (typeof SYSTEM_ACTIONS)[number];

export const ALL_COLLECTIONS = "*";
export const SUPER_ADMIN_GRANT = "*:*";

export type CollectionPermissionFlags = Partial<Record<CollectionAction, boolean>>;

export type SystemPermissionFlags = Partial<Record<SystemAction | "superAdmin", boolean>>;

export interface RolePermissions {
  collections: Record<string, CollectionPermissionFlags>;
  system: SystemPermissionFlags;
}

export interface UserRolesRecord {
  userId: string;
  roleIds: string[];
  grants: string[];
  updatedAt?: string;
}
