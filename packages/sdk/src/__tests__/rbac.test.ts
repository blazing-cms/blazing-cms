import { describe, expect, it, vi, beforeEach } from "vitest";

const mockDb = { type: "firestore" } as never;

vi.mock("firebase/firestore", () => {
  const mockDoc = vi.fn((..._args: unknown[]) => ({ id: "ref-id", kind: "doc" }));
  return {
    addDoc: vi.fn(async (_ref: unknown, data: unknown) => ({ data, id: "role-new" })),
    collection: vi.fn(() => ({ kind: "collection" })),
    deleteDoc: vi.fn(async () => undefined),
    doc: mockDoc,
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(async () => undefined),
    updateDoc: vi.fn(async () => undefined),
  };
});

const firestore = await import("firebase/firestore");
const { createRbacApi, expandPermissions, mergeGrants } = await import("../rbac.js");

function makeSnap(id: string, data?: Record<string, unknown>) {
  return {
    data: () => data ?? {},
    exists: () => data !== undefined,
    id,
    ref: { id },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("expandPermissions", () => {
  it("grants super admin for the superAdmin flag", () => {
    expect(expandPermissions({ collections: {}, system: { superAdmin: true } })).toEqual(["*:*"]);
  });

  it("expands collection flags and system actions, sorted", () => {
    const result = expandPermissions({
      collections: {
        "*": { read: true },
        posts: { create: true, publish: true, read: true },
      },
      system: { manageMedia: true, manageRoles: true },
    });
    expect(result).toEqual([
      "collections:*:read",
      "collections:posts:create",
      "collections:posts:publish",
      "collections:posts:read",
      "system:manageMedia",
      "system:manageRoles",
    ]);
  });

  it("ignores falsy flags and missing permissions", () => {
    expect(expandPermissions(undefined)).toEqual([]);
    expect(expandPermissions({ collections: { posts: { delete: false } }, system: {} })).toEqual(
      [],
    );
  });
});

describe("mergeGrants", () => {
  it("dedupes and sorts across lists", () => {
    expect(
      mergeGrants(["collections:posts:read", "system:manageRoles"], ["collections:posts:read"]),
    ).toEqual(["collections:posts:read", "system:manageRoles"]);
  });
});

describe("createRbacApi", () => {
  const editorRole = {
    description: "Content editor",
    name: "Editor",
    permissions: {
      collections: { posts: { create: true, read: true } },
      system: {},
    },
  };

  it("listRoles maps documents to roles", async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [makeSnap("role-editor", editorRole)],
    } as never);
    const api = createRbacApi(mockDb);
    const roles = await api.listRoles();
    expect(roles).toEqual([{ id: "role-editor", ...editorRole }]);
    expect(firestore.collection).toHaveBeenCalledWith(mockDb, "collections_roles");
  });

  it("getRole returns null when not found", async () => {
    vi.mocked(firestore.getDoc).mockResolvedValue(makeSnap("missing", undefined) as never);
    const api = createRbacApi(mockDb);
    expect(await api.getRole("missing")).toBeNull();
  });

  it("createRole adds a new role document", async () => {
    const api = createRbacApi(mockDb);
    const id = await api.createRole({ name: "Reviewer" });
    expect(id).toBe("role-new");
    expect(firestore.addDoc).toHaveBeenCalledWith(expect.anything(), { name: "Reviewer" });
  });

  it("updateRole patches the role document", async () => {
    const api = createRbacApi(mockDb);
    await api.updateRole("role-editor", { description: "Senior editor" });
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), {
      description: "Senior editor",
    });
  });

  it("deleteRole removes the role document", async () => {
    const api = createRbacApi(mockDb);
    await api.deleteRole("role-editor");
    expect(firestore.deleteDoc).toHaveBeenCalled();
  });

  it("getUserRoles merges document id as userId", async () => {
    vi.mocked(firestore.getDoc).mockResolvedValue(
      makeSnap("u1", { grants: ["collections:posts:read"], roleIds: ["role-editor"] }) as never,
    );
    const api = createRbacApi(mockDb);
    const assignment = await api.getUserRoles("u1");
    expect(assignment).toEqual({
      grants: ["collections:posts:read"],
      roleIds: ["role-editor"],
      userId: "u1",
    });
  });

  it("assignRoles computes grants from matching roles and writes the assignment", async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [makeSnap("role-editor", editorRole)],
    } as never);
    const api = createRbacApi(mockDb);
    await api.assignRoles("u1", ["role-editor", "role-missing"]);

    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        grants: ["collections:posts:create", "collections:posts:read"],
        roleIds: ["role-editor", "role-missing"],
        updatedAt: expect.any(String),
        userId: "u1",
      },
      { merge: true },
    );
  });

  it("assignRoles writes empty grants for no roles", async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({ docs: [] } as never);
    const api = createRbacApi(mockDb);
    await api.assignRoles("u1", []);
    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ grants: [], roleIds: [] }),
      { merge: true },
    );
  });
});
