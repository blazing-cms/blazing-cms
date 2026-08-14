import { describe, expect, it } from "vitest";

import {
  bootstrapAdminGrants,
  emptyPermissions,
  expandRolePermissions,
  hasCollectionPermission,
  hasGrant,
  hasSystemGrant,
  legacyRoleIds,
  mergeGrants,
  normalizePermissions,
  resolveRoleIds,
  resolveUserGrants,
  roleIdsFromRecords,
  rolesOverlap,
  setCollectionAction,
  setSystemFlag,
} from "./permissions";

describe("normalizePermissions", () => {
  it("returns empty permissions for malformed input", () => {
    expect(normalizePermissions(null)).toEqual({ collections: {}, system: {} });
    expect(normalizePermissions("nope")).toEqual({ collections: {}, system: {} });
  });

  it("keeps only true flags", () => {
    const perms = normalizePermissions({
      collections: { posts: { create: true, delete: false, read: 0, update: "yes" } },
      system: { manageRoles: true, manageUsers: "yes" },
    });
    expect(perms).toEqual({
      collections: { posts: { create: true } },
      system: { manageRoles: true },
    });
  });

  it("drops collection entries with no granted flags", () => {
    const perms = normalizePermissions({ collections: { posts: { read: false } }, system: {} });
    expect(perms.collections).toEqual({});
  });
});

describe("expandRolePermissions", () => {
  it("expands nested flags into sorted grant tokens", () => {
    const grants = expandRolePermissions({
      collections: { posts: { create: true, read: true } },
      system: { manageRoles: true },
    });
    expect(grants).toEqual([
      "collections:posts:create",
      "collections:posts:read",
      "system:manageRoles",
    ]);
  });

  it("adds the super admin grant", () => {
    const grants = expandRolePermissions({ collections: {}, system: { superAdmin: true } });
    expect(grants).toEqual(["*:*"]);
  });
});

describe("mergeGrants", () => {
  it("unions and sorts multiple grant lists", () => {
    expect(mergeGrants(["b:1", "a:2"], ["b:1"], [])).toEqual(["a:2", "b:1"]);
  });
});

describe("bootstrapAdminGrants", () => {
  it("grants super admin when no roles exist", () => {
    expect(bootstrapAdminGrants([])).toEqual(["*:*"]);
  });

  it("returns no bootstrap grants once roles exist", () => {
    expect(bootstrapAdminGrants([{ id: "role-editor" }])).toEqual([]);
  });
});

describe("hasGrant", () => {
  it("grants direct, wildcard, and super admin access", () => {
    const grants = ["collections:posts:read", "collections:*:update", "system:manageRoles"];
    expect(hasGrant(grants, "read", "posts")).toBe(true);
    expect(hasGrant(grants, "update", "pages")).toBe(true);
    expect(hasGrant(grants, "create", "posts")).toBe(false);
    expect(hasGrant(["*:*"], "create", "anything")).toBe(true);
  });
});

describe("hasSystemGrant", () => {
  it("requires the exact system grant or super admin", () => {
    expect(hasSystemGrant(["system:manageUsers"], "manageUsers")).toBe(true);
    expect(hasSystemGrant(["system:manageRoles"], "manageUsers")).toBe(false);
    expect(hasSystemGrant(["*:*"], "manageUsers")).toBe(true);
  });
});

describe("hasCollectionPermission", () => {
  it("checks specific, wildcard, and super admin flags", () => {
    const perms = {
      collections: { posts: { read: true } },
      system: {},
    };
    expect(hasCollectionPermission(perms, "posts", "read")).toBe(true);
    expect(hasCollectionPermission(perms, "posts", "create")).toBe(false);
    expect(
      hasCollectionPermission(
        { collections: { "*": { delete: true } }, system: {} },
        "pages",
        "delete",
      ),
    ).toBe(true);
    expect(
      hasCollectionPermission({ collections: {}, system: { superAdmin: true } }, "x", "read"),
    ).toBe(true);
  });
});

describe("setCollectionAction", () => {
  it("toggles a flag on and prunes empty entries", () => {
    let perms = emptyPermissions();
    perms = setCollectionAction(perms, "posts", "read", true);
    expect(perms.collections.posts).toEqual({ read: true });
    perms = setCollectionAction(perms, "posts", "read", false);
    expect(perms.collections).toEqual({});
  });
});

describe("setSystemFlag", () => {
  it("updates a system flag immutably", () => {
    const perms = setSystemFlag(emptyPermissions(), "manageRoles", true);
    expect(perms.system.manageRoles).toBe(true);
    expect(setSystemFlag(perms, "manageRoles", false).system.manageRoles).toBeUndefined();
  });
});

describe("legacyRoleIds", () => {
  it("parses string and array role fields", () => {
    expect(legacyRoleIds({ role: "Editor" })).toEqual(["Editor"]);
    expect(legacyRoleIds({ role: ["Admin", 5] })).toEqual(["Admin"]);
    expect(legacyRoleIds({ role: "" })).toEqual([]);
    expect(legacyRoleIds({})).toEqual([]);
  });
});

describe("resolveRoleIds", () => {
  const roles = [
    { id: "r1", name: "Admin" },
    { id: "r2", name: "Editor" },
  ];
  it("matches by id or legacy name", () => {
    expect(resolveRoleIds(["r1"], roles)).toEqual(["r1"]);
    expect(resolveRoleIds(["Editor"], roles)).toEqual(["r2"]);
    expect(resolveRoleIds(["r1", "Editor"], roles)).toEqual(["r1", "r2"]);
    expect(resolveRoleIds(["Ghost"], roles)).toEqual([]);
  });
});

describe("resolveUserGrants", () => {
  const roles = [
    { id: "r1", permissions: { collections: { posts: { read: true } }, system: {} } },
    { id: "r2", permissions: { collections: {}, system: { manageRoles: true } } },
  ];
  it("merges grants from assigned roles only", () => {
    const grants = resolveUserGrants({ roleIds: ["r1", "r2"] }, roles);
    expect(grants).toEqual(["collections:posts:read", "system:manageRoles"]);
    expect(resolveUserGrants({ roleIds: ["r1"] }, roles)).toEqual(["collections:posts:read"]);
  });
});

describe("rolesOverlap", () => {
  it("allows when no restriction is set and denies on mismatch", () => {
    expect(rolesOverlap(["r1"])).toBe(true);
    expect(rolesOverlap(["r1"], [])).toBe(true);
    expect(rolesOverlap(["r1"], ["r1", "r2"])).toBe(true);
    expect(rolesOverlap(["r3"], ["r1", "r2"])).toBe(false);
  });
});

describe("roleIdsFromRecords", () => {
  const roles = [
    { id: "r1", name: "Admin" },
    { id: "r2", name: "Editor" },
  ];
  it("prefers the user_roles record when present", () => {
    expect(
      roleIdsFromRecords({ grants: [], roleIds: ["r2"], userId: "u1" }, { role: "r1" }, roles),
    ).toEqual(["r2"]);
  });
  it("falls back to a legacy role name or id on the user record", () => {
    expect(roleIdsFromRecords(null, { role: "Editor" }, roles)).toEqual(["r2"]);
    expect(roleIdsFromRecords(undefined, { role: "r1" }, roles)).toEqual(["r1"]);
  });
  it("returns empty when nothing matches", () => {
    expect(roleIdsFromRecords(null, {}, roles)).toEqual([]);
    expect(roleIdsFromRecords(null, { role: "Ghost" }, roles)).toEqual([]);
    expect(roleIdsFromRecords(null, null, roles)).toEqual([]);
  });
});
