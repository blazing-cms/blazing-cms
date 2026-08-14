import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {};
const colRef = {};

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => colRef),
  getCountFromServer: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn((n: number) => ({ limit: n })),
  query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({ constraints, ref })),
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));

const fsMod = await import("firebase/firestore");

const makeDoc = (data: Record<string, unknown>) => ({ data: () => data });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createAnalyticsApi", () => {
  it("getContentCounts aggregates counts across entries, globals, media, and users", async () => {
    vi.mocked(fsMod.getCountFromServer).mockResolvedValue({
      data: () => ({ count: 5 }),
    } as never);
    const { createAnalyticsApi } = await import("../analytics.js");
    const api = createAnalyticsApi(mockDb as never);
    const counts = await api.getContentCounts({
      collections: ["posts", "categories"],
      globals: ["site-settings"],
    });
    expect(counts).toEqual({
      totalCollections: 2,
      totalEntries: 10,
      totalGlobals: 5,
      totalMedia: 5,
      totalUsers: 5,
    });
    expect(fsMod.collection).toHaveBeenCalledWith(mockDb, "collections_posts");
    expect(fsMod.collection).toHaveBeenCalledWith(mockDb, "collections_categories");
    expect(fsMod.collection).toHaveBeenCalledWith(mockDb, "globals_site-settings");
    expect(fsMod.collection).toHaveBeenCalledWith(mockDb, "collections_media");
    expect(fsMod.collection).toHaveBeenCalledWith(mockDb, "collections_users");
  });

  it("getContentCounts tolerates failed counts", async () => {
    vi.mocked(fsMod.getCountFromServer).mockRejectedValue(new Error("denied") as never);
    const { createAnalyticsApi } = await import("../analytics.js");
    const api = createAnalyticsApi(mockDb as never);
    const counts = await api.getContentCounts({ collections: ["posts"], globals: [] });
    expect(counts.totalEntries).toBe(0);
    expect(counts.totalUsers).toBe(0);
  });

  it("getContentByCollection returns a count per collection", async () => {
    vi.mocked(fsMod.getCountFromServer)
      .mockResolvedValueOnce({ data: () => ({ count: 3 }) } as never)
      .mockResolvedValueOnce({ data: () => ({ count: 7 }) } as never);
    const { createAnalyticsApi } = await import("../analytics.js");
    const api = createAnalyticsApi(mockDb as never);
    const result = await api.getContentByCollection({ collections: ["posts", "categories"] });
    expect(result).toEqual([
      { count: 3, slug: "posts" },
      { count: 7, slug: "categories" },
    ]);
  });

  it("getContentChangesOverTime buckets entries by day within the period", async () => {
    const now = Date.now();
    const within = new Date(now - 2 * 86400000).toISOString();
    const outside = new Date(now - 100 * 86400000).toISOString();
    const allDocs = [
      makeDoc({ createdAt: within }),
      makeDoc({ createdAt: within }),
      makeDoc({ createdAt: outside }),
      makeDoc({ createdAt: undefined }),
    ];
    vi.mocked(fsMod.getDocs).mockImplementation(
      (q: { constraints?: { field: string; op: string; value: unknown }[] }) => {
        const filters = q.constraints ?? [];
        let docs = allDocs;
        for (const c of filters) {
          if (c.op === ">=") docs = docs.filter((d) => d.data().createdAt >= c.value);
        }
        return Promise.resolve({ docs } as never);
      },
    );
    const { createAnalyticsApi } = await import("../analytics.js");
    const api = createAnalyticsApi(mockDb as never);
    const result = await api.getContentChangesOverTime({
      period: "30d",
      scope: { collections: ["posts"] },
    });
    expect(result.period).toBe("30d");
    expect(result.points).toEqual([{ count: 2, date: within.slice(0, 10) }]);
    expect(fsMod.where).toHaveBeenCalledWith("createdAt", ">=", expect.any(String));
  });

  it("getStorageUsage sums sizes grouped by file type", async () => {
    vi.mocked(fsMod.getDocs).mockResolvedValue({
      docs: [
        makeDoc({ size: 1000, type: "image/png" }),
        makeDoc({ size: 2000, type: "video/mp4" }),
        makeDoc({ size: 500, type: "application/pdf" }),
        makeDoc({ size: 700, type: "audio/mpeg" }),
        makeDoc({ size: 100, type: "image/svg+xml" }),
        makeDoc({ size: 50, type: "weird/x" }),
        makeDoc({ size: "nope", type: "image/jpeg" }),
      ],
    } as never);
    const { createAnalyticsApi } = await import("../analytics.js");
    const api = createAnalyticsApi(mockDb as never);
    const result = await api.getStorageUsage();
    expect(result).toEqual({
      byType: { audio: 700, document: 500, image: 1100, other: 50, video: 2000 },
      totalBytes: 4350,
    });
  });

  it("getStorageUsage returns zeroed usage when the query fails", async () => {
    vi.mocked(fsMod.getDocs).mockRejectedValue(new Error("denied") as never);
    const { createAnalyticsApi } = await import("../analytics.js");
    const api = createAnalyticsApi(mockDb as never);
    const result = await api.getStorageUsage();
    expect(result.totalBytes).toBe(0);
    expect(result.byType).toEqual({ audio: 0, document: 0, image: 0, other: 0, video: 0 });
  });

  it("getUserActivity returns distinct active users and top contributors", async () => {
    vi.mocked(fsMod.getDocs).mockResolvedValue({
      docs: [
        makeDoc({ createdAt: new Date().toISOString(), createdBy: "alice" }),
        makeDoc({ createdAt: new Date().toISOString(), createdBy: "alice" }),
        makeDoc({ createdAt: new Date().toISOString(), createdBy: "bob" }),
        makeDoc({ createdAt: new Date().toISOString(), updatedBy: "alice" }),
        makeDoc({ createdAt: new Date().toISOString() }),
      ],
    } as never);
    const { createAnalyticsApi } = await import("../analytics.js");
    const api = createAnalyticsApi(mockDb as never);
    const result = await api.getUserActivity({ period: "7d", scope: { collections: ["posts"] } });
    expect(result.activeUsers).toBe(2);
    expect(result.topContributors[0]).toEqual({ count: 3, userId: "alice" });
    expect(result.topContributors[1]).toEqual({ count: 1, userId: "bob" });
  });

  it("getSummary combines all analytics", async () => {
    vi.mocked(fsMod.getCountFromServer).mockResolvedValue({
      data: () => ({ count: 0 }),
    } as never);
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs: [] } as never);
    const { createAnalyticsApi } = await import("../analytics.js");
    const api = createAnalyticsApi(mockDb as never);
    const summary = await api.getSummary({ period: "30d", scope: { collections: ["posts"] } });
    expect(summary).toHaveProperty("counts");
    expect(summary).toHaveProperty("byCollection");
    expect(summary).toHaveProperty("changes");
    expect(summary).toHaveProperty("storage");
    expect(summary).toHaveProperty("activity");
  });

  it("returns empty results when analytics is disabled", async () => {
    const { createAnalyticsApi } = await import("../analytics.js");
    const api = createAnalyticsApi(mockDb as never, { enabled: false });
    const summary = await api.getSummary({ period: "30d", scope: { collections: ["posts"] } });
    expect(summary.counts.totalEntries).toBe(0);
    expect(summary.byCollection).toEqual([]);
    expect(fsMod.getCountFromServer).not.toHaveBeenCalled();
  });
});
