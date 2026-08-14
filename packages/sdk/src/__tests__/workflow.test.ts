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
    doc: mockDoc,
    getDoc: vi.fn(),
    limit: vi.fn((n: number) => ({ limit: n })),
    query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({ constraints, ref })),
    updateDoc: vi.fn(),
    where: vi.fn((f: string, op: unknown, v: unknown) => ({ field: f, op, value: v })),
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

function entrySnap(state: string, reviewer?: string, history?: unknown[]) {
  return makeSnap("doc-1", {
    reviewer,
    title: "Post",
    workflowHistory: history ?? [],
    workflowState: state,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createWorkflowApi", () => {
  it("transition appends a history record and updates the state", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(entrySnap("draft") as never);
    const { createWorkflowApi } = await import("../workflow.js");
    const api = createWorkflowApi(mockDb as never);
    await api.transition("posts", "doc-1", "review");

    expect(fsMod.updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ segments: ["posts", "doc-1"] }),
      expect.objectContaining({
        reviewer: null,
        workflowState: "review",
      }),
    );
    const patch = vi.mocked(fsMod.updateDoc).mock.calls[0][1] as Record<string, unknown>;
    const history = patch.workflowHistory as Array<Record<string, unknown>>;
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ from: "draft", to: "review", user: "author-1" });
  });

  it("transition carries a comment, keeps the reviewer, and notifies a new reviewer", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(entrySnap("review", "old-reviewer") as never);
    const { createWorkflowApi } = await import("../workflow.js");
    const api = createWorkflowApi(mockDb as never);
    await api.transition("posts", "doc-1", "published", {
      comment: "Looks good",
      reviewer: "reviewer-2",
    });

    const patch = vi.mocked(fsMod.updateDoc).mock.calls[0][1] as Record<string, unknown>;
    expect(patch).toMatchObject({ reviewer: "reviewer-2", workflowState: "published" });
    expect((patch.workflowHistory as Array<Record<string, unknown>>)[0].comment).toBe("Looks good");
    expect(fsMod.addDoc).toHaveBeenCalledWith(
      expect.objectContaining({ segments: ["notifications"] }),
      expect.objectContaining({
        message: "You have been assigned to review a posts entry",
        read: false,
        type: "workflow-review",
        userId: "reviewer-2",
      }),
    );
  });

  it("transition throws when the entry does not exist", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(makeSnap("missing", undefined, false) as never);
    const { createWorkflowApi } = await import("../workflow.js");
    const api = createWorkflowApi(mockDb as never);
    await expect(api.transition("posts", "missing", "review")).rejects.toThrow("Entry not found");
    expect(fsMod.updateDoc).not.toHaveBeenCalled();
  });

  it("transition propagates write failures", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(entrySnap("review") as never);
    vi.mocked(fsMod.updateDoc).mockRejectedValueOnce(new Error("denied"));
    const { createWorkflowApi } = await import("../workflow.js");
    const api = createWorkflowApi(mockDb as never);
    await expect(api.transition("posts", "doc-1", "published")).rejects.toThrow("denied");
    expect(fsMod.addDoc).not.toHaveBeenCalled();
  });

  it("assignReviewer sets the reviewer field", async () => {
    const { createWorkflowApi } = await import("../workflow.js");
    const api = createWorkflowApi(mockDb as never);
    await api.assignReviewer("posts", "doc-1", "reviewer-9");
    expect(fsMod.updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ segments: ["posts", "doc-1"] }),
      { reviewer: "reviewer-9" },
    );
  });

  it("history returns stored transitions or an empty list", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(
      entrySnap("published", undefined, [
        { at: "t1", from: "draft", to: "review" },
        { at: "t2", from: "review", to: "published" },
      ]) as never,
    );
    const { createWorkflowApi } = await import("../workflow.js");
    const api = createWorkflowApi(mockDb as never);
    const history = await api.history("posts", "doc-1");
    expect(history.map((h) => h.to)).toEqual(["review", "published"]);

    vi.mocked(fsMod.getDoc).mockResolvedValue(makeSnap("missing", undefined, false) as never);
    expect(await api.history("posts", "missing")).toEqual([]);
  });
});
