import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApp = { name: "test-app" };
const mockAuthInstance = { currentUser: { uid: "user-1" } };
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
    collection: vi.fn((db: unknown, ...segments: unknown[]) => ({ db, segments })),
    doc: mockDoc,
    getDocs: vi.fn(),
    limit: vi.fn((n: number) => ({ limit: n })),
    query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({ constraints, ref })),
    updateDoc: vi.fn(),
    where: vi.fn((f: string, op: unknown, v: unknown) => ({ field: f, op, value: v })),
  };
});

const fsMod = await import("firebase/firestore");

function makeSnap(id: string, data: Record<string, unknown>) {
  return { data: () => data, exists: () => true, id };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createNotificationsApi", () => {
  it("list returns the signed-in user's notifications, newest first", async () => {
    vi.mocked(fsMod.getDocs).mockResolvedValue({
      docs: [
        makeSnap("n1", {
          collection: "posts",
          createdAt: "2026-07-30T00:00:00.000Z",
          entryId: "p1",
          message: "Review needed",
          read: false,
          type: "workflow-review",
          userId: "user-1",
        }),
        makeSnap("n2", {
          createdAt: "2026-07-31T00:00:00.000Z",
          message: "Older",
          read: true,
          type: "workflow-review",
          userId: "user-1",
        }),
      ],
    } as never);
    const { createNotificationsApi } = await import("../notifications.js");
    const api = createNotificationsApi(mockDb as never);
    const notifications = await api.list({ limit: 10 });

    expect(fsMod.where).toHaveBeenCalledWith("userId", "==", "user-1");
    expect(notifications.map((n) => n.id)).toEqual(["n2", "n1"]);
    expect(notifications[1]).toMatchObject({
      collection: "posts",
      entryId: "p1",
      message: "Review needed",
      read: false,
    });
  });

  it("list returns an empty array when no user is signed in", async () => {
    mockAuthInstance.currentUser = null;
    const { createNotificationsApi } = await import("../notifications.js");
    const api = createNotificationsApi(mockDb as never);
    expect(await api.list()).toEqual([]);
    expect(fsMod.getDocs).not.toHaveBeenCalled();
  });

  it("markRead updates each notification", async () => {
    const { createNotificationsApi } = await import("../notifications.js");
    const api = createNotificationsApi(mockDb as never);
    await api.markRead(["n1", "n2"]);
    expect(fsMod.updateDoc).toHaveBeenCalledTimes(2);
    expect(fsMod.updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ segments: ["notifications", "n1"] }),
      { read: true },
    );
  });
});
