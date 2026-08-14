import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApp = { name: "test-app" };
const mockAuthInstance = { currentUser: { uid: "author-1" } };
const mockDb = { app: mockApp };

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => mockAuthInstance),
}));

vi.mock("firebase/firestore", () => {
  const mockDoc = vi.fn((db: unknown, ...segments: unknown[]) => ({
    db,
    id: segments.at(-1),
    segments,
  }));
  return {
    addDoc: vi.fn(),
    collection: vi.fn((db: unknown, ...segments: unknown[]) => ({ db, segments })),
    deleteDoc: vi.fn(),
    doc: mockDoc,
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn((n: number) => ({ limit: n })),
    orderBy: vi.fn((f: string, d: unknown) => ({ direction: d, field: f })),
    query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({ constraints, ref })),
    setDoc: vi.fn(),
  };
});

const fsMod = await import("firebase/firestore");

function makeSnap(
  id: string,
  data?: Record<string, unknown>,
  exists = true,
): { data: () => Record<string, unknown> | null; exists: () => boolean; id: string } {
  return { data: () => data ?? null, exists: () => exists, id };
}

function versionSnap(id: string, number: number, data: Record<string, unknown>) {
  return makeSnap(id, {
    author: "author-1",
    createdAt: "2026-07-30T00:00:00.000Z",
    data,
    kind: "entry",
    number,
    parentId: "doc-1",
    parentType: "posts",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("diffVersionData", () => {
  it("reports added, removed, changed, and unchanged fields", async () => {
    const { diffVersionData } = await import("../versions.js");
    const diff = diffVersionData(
      { count: 1, status: "draft", title: "Old" },
      { author: "x", status: "draft", title: "New" },
    );
    expect(diff).toEqual([
      { after: "x", before: undefined, changed: true, field: "author" },
      { after: undefined, before: 1, changed: true, field: "count" },
      { after: "draft", before: "draft", changed: false, field: "status" },
      { after: "New", before: "Old", changed: true, field: "title" },
    ]);
  });
});

describe("snapshotVersion", () => {
  it("skips when the parent document does not exist", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(makeSnap("doc-1", undefined, false) as never);
    const { snapshotVersion } = await import("../versions.js");
    await snapshotVersion(mockDb as never, { collection: "posts", id: "doc-1", kind: "entry" });
    expect(fsMod.addDoc).not.toHaveBeenCalled();
  });

  it("writes a version with an incremented number and author", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(makeSnap("doc-1", { title: "Current" }) as never);
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs: [makeSnap("v2", { number: 4 })] } as never);
    const { snapshotVersion } = await import("../versions.js");
    await snapshotVersion(
      mockDb as never,
      { collection: "posts", id: "doc-1", kind: "entry" },
      "Edited",
    );
    expect(fsMod.addDoc).toHaveBeenCalledWith(
      { db: mockDb, segments: ["posts/doc-1/versions"] },
      expect.objectContaining({
        author: "author-1",
        data: { title: "Current" },
        kind: "entry",
        number: 5,
        parentId: "doc-1",
        parentType: "posts",
        summary: "Edited",
      }),
    );
  });

  it("starts numbering at 1 when no versions exist", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(makeSnap("value", { title: "Site" }) as never);
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs: [] } as never);
    const { snapshotVersion } = await import("../versions.js");
    await snapshotVersion(mockDb as never, { kind: "global", slug: "site-settings" });
    expect(fsMod.addDoc).toHaveBeenCalledWith(
      { db: mockDb, segments: ["globals_site-settings/value/versions"] },
      expect.objectContaining({
        kind: "global",
        number: 1,
        parentId: "value",
        parentType: "globals_site-settings",
      }),
    );
  });
});

describe("enforceKeep", () => {
  it("deletes the oldest versions beyond keep", async () => {
    const docs = [1, 2, 3, 4, 5].map((n) => versionSnap(`v${n}`, n, { n }));
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs } as never);
    const { enforceKeep } = await import("../versions.js");
    const removed = await enforceKeep(mockDb as never, "posts/doc-1/versions", 3);
    expect(removed).toBe(2);
    expect(fsMod.deleteDoc).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(fsMod.deleteDoc).mock.calls.map((c) => c[0]);
    expect(calls).toEqual([
      expect.objectContaining({ id: "v4" }),
      expect.objectContaining({ id: "v5" }),
    ]);
  });
});

describe("createVersionsApi", () => {
  const target = { collection: "posts", id: "doc-1", kind: "entry" as const };

  it("list returns versions from the subcollection", async () => {
    vi.mocked(fsMod.getDocs).mockResolvedValue({
      docs: [versionSnap("v3", 3, { title: "Three" }), versionSnap("v2", 2, { title: "Two" })],
    } as never);
    const { createVersionsApi } = await import("../versions.js");
    const api = createVersionsApi(mockDb as never);
    const versions = await api.list(target);
    expect(versions.map((v) => v.number)).toEqual([3, 2]);
    expect(fsMod.orderBy).toHaveBeenCalledWith("number", "desc");
  });

  it("get returns a single version or null", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(versionSnap("v2", 2, { title: "Two" }) as never);
    const { createVersionsApi } = await import("../versions.js");
    const api = createVersionsApi(mockDb as never);
    const version = await api.get(target, "v2");
    expect(version?.number).toBe(2);
    vi.mocked(fsMod.getDoc).mockResolvedValue(makeSnap("missing", undefined, false) as never);
    expect(await api.get(target, "missing")).toBeNull();
  });

  it("diff compares two versions field by field", async () => {
    vi.mocked(fsMod.getDoc).mockImplementation((docRef: { id?: string }) =>
      Promise.resolve(
        docRef.id === "v1"
          ? (versionSnap("v1", 1, { status: "draft", title: "Old" }) as never)
          : (versionSnap("v2", 2, { status: "draft", title: "New" }) as never),
      ),
    );
    const { createVersionsApi } = await import("../versions.js");
    const api = createVersionsApi(mockDb as never);
    const diff = await api.diff(target, "v1", "v2");
    expect(diff.find((d) => d.field === "title")?.changed).toBe(true);
    expect(diff.find((d) => d.field === "status")?.changed).toBe(false);
  });

  it("restore snapshots the current state then writes the version data", async () => {
    vi.mocked(fsMod.getDoc).mockImplementation((docRef: { id?: string }) =>
      Promise.resolve(
        docRef.id === "v2"
          ? (versionSnap("v2", 2, { title: "Old" }) as never)
          : (makeSnap("value", { title: "Current" }) as never),
      ),
    );
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs: [makeSnap("v2", { number: 2 })] } as never);
    const { createVersionsApi } = await import("../versions.js");
    const api = createVersionsApi(mockDb as never);
    await api.restore(target, "v2");
    expect(fsMod.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ segments: ["posts", "doc-1"] }),
      { title: "Old" },
      { merge: true },
    );
  });

  it("remove deletes a version", async () => {
    const { createVersionsApi } = await import("../versions.js");
    const api = createVersionsApi(mockDb as never);
    await api.remove(target, "v2");
    expect(fsMod.deleteDoc).toHaveBeenCalledWith(
      expect.objectContaining({ segments: ["posts/doc-1/versions", "v2"] }),
    );
  });

  it("prune deletes beyond keep and applies the age TTL", async () => {
    const now = Date.now();
    const docs = [1, 2, 3, 4].map((n) =>
      makeSnap(`v${n}`, {
        createdAt: new Date(now - n * 10 * 86_400_000).toISOString(),
        number: n,
      }),
    );
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs } as never);
    const { createVersionsApi } = await import("../versions.js");
    const api = createVersionsApi(mockDb as never);
    const removed = await api.prune(target, { keep: 2, olderThanDays: 5 });
    expect(removed).toBe(2);
  });
});
