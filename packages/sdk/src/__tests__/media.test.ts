import { describe, expect, it, vi, beforeEach } from "vitest";

const mockDb = { type: "firestore" } as never;
const mockStorage = { type: "storage" } as never;

const mockTask = {
  on: vi.fn(
    (_event: string, cb: (snap: { bytesTransferred: number; totalBytes: number }) => void) => {
      cb({ bytesTransferred: 500, totalBytes: 1000 });
    },
  ),
};

vi.mock("firebase/firestore", () => {
  const mockCollection = vi.fn(() => ({ kind: "collection" }));
  const mockDoc = vi.fn((..._args: unknown[]) => ({ id: "auto-id", kind: "doc" }));
  return {
    addDoc: vi.fn(async (ref: unknown, data: unknown) => ({ data, id: "folder-id", ref })),
    collection: mockCollection,
    deleteDoc: vi.fn(async () => undefined),
    doc: mockDoc,
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn((n: number) => ({ limit: n })),
    orderBy: vi.fn((f: string, d: unknown) => ({ direction: d, field: f })),
    query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({ constraints, ref })),
    setDoc: vi.fn(async () => undefined),
    updateDoc: vi.fn(async () => undefined),
    where: vi.fn((f: string, op: string, v: unknown) => ({ field: f, op, value: v })),
    writeBatch: vi.fn(() => ({
      commit: vi.fn(async () => undefined),
      delete: vi.fn(),
      update: vi.fn(),
    })),
  };
});

vi.mock("firebase/storage", () => ({
  deleteObject: vi.fn(async () => undefined),
  getDownloadURL: vi.fn(async () => "https://download.example/logo.png"),
  getStorage: vi.fn(() => mockStorage),
  ref: vi.fn((_storage: unknown, path: string) => ({ path })),
  uploadBytesResumable: vi.fn((_ref: unknown, _file: File, metadata: unknown) => {
    return { metadata, on: mockTask.on };
  }),
}));

const firestore = await import("firebase/firestore");
const storage = await import("firebase/storage");
const { createMediaApi, referencesValue, validateMediaFile } = await import("../media.js");

function makeFile(name = "logo.png", type = "image/png", size = 1024): File {
  return new File(["x".repeat(size)], name, { type });
}

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

describe("validateMediaFile", () => {
  it("accepts supported image, video, and pdf types", () => {
    expect(() => validateMediaFile(makeFile("a.png", "image/png"))).not.toThrow();
    expect(() => validateMediaFile(makeFile("b.mp4", "video/mp4"))).not.toThrow();
    expect(() => validateMediaFile(makeFile("c.pdf", "application/pdf"))).not.toThrow();
  });

  it("rejects unsupported file types", () => {
    expect(() => validateMediaFile(makeFile("a.exe", "application/x-msdownload"))).toThrow(
      "Unsupported file type",
    );
  });

  it("rejects files over the max size", () => {
    expect(() => validateMediaFile(makeFile("big.png", "image/png", 21 * 1024 * 1024))).toThrow(
      "upload limit",
    );
  });
});

describe("createMediaApi", () => {
  it("upload uploads to storage, reports progress, and creates the record", async () => {
    const api = createMediaApi(mockDb, mockStorage);
    const onProgress = vi.fn();
    const item = await api.upload(makeFile(), { folder: "f1", onProgress, tags: ["hero"] });

    expect(storage.ref).toHaveBeenCalledWith(mockStorage, "media/auto-id/logo.png");
    expect(storage.uploadBytesResumable).toHaveBeenCalled();
    expect(storage.getDownloadURL).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(50);
    expect(firestore.setDoc).toHaveBeenCalled();
    const setData = vi.mocked(firestore.setDoc).mock.calls[0][1] as Record<string, unknown>;
    expect(setData).toMatchObject({
      folder: "f1",
      mimeType: "image/png",
      name: "logo.png",
      size: 1024,
      storagePath: "media/auto-id/logo.png",
      tags: ["hero"],
      url: "https://download.example/logo.png",
    });
    expect(item.id).toBe("auto-id");
    expect(item.url).toBe("https://download.example/logo.png");
  });

  it("upload rejects files over the configured max size", async () => {
    const api = createMediaApi(mockDb, mockStorage, { maxFileSize: 10 * 1024 });
    await expect(api.upload(makeFile("big.png", "image/png", 20 * 1024))).rejects.toThrow(
      "upload limit",
    );
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });

  it("get returns the media item", async () => {
    vi.mocked(firestore.getDoc).mockResolvedValue(
      makeSnap("m1", {
        name: "logo.png",
        storagePath: "media/m1/logo.png",
        url: "https://x/1",
      }) as never,
    );
    const api = createMediaApi(mockDb, mockStorage);
    const item = await api.get("m1");
    expect(item?.name).toBe("logo.png");
    expect(item?.id).toBe("m1");
  });

  it("get returns null for a missing document", async () => {
    vi.mocked(firestore.getDoc).mockResolvedValue(makeSnap("missing", undefined) as never);
    const api = createMediaApi(mockDb, mockStorage);
    expect(await api.get("missing")).toBeNull();
  });

  it("list applies folder, tag, and orderBy constraints", async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({ docs: [] } as never);
    const api = createMediaApi(mockDb, mockStorage);
    await api.list({ folder: null, limit: 20, search: "logo", tag: "hero" });
    expect(firestore.where).toHaveBeenCalledWith("folder", "==", null);
    expect(firestore.where).toHaveBeenCalledWith("tags", "array-contains", "hero");
    expect(firestore.orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(firestore.limit).toHaveBeenCalledWith(20);
  });

  it("list applies client-side search filtering", async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [
        makeSnap("1", { name: "Logo Dark.png", storagePath: "p1", tags: [], url: "u1" }),
        makeSnap("2", { name: "Hero.jpg", storagePath: "p2", tags: [], url: "u2" }),
      ],
    } as never);
    const api = createMediaApi(mockDb, mockStorage);
    const items = await api.list({ search: "logo" });
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("Logo Dark.png");
  });

  it("update writes the changed fields with a fresh updatedAt", async () => {
    const api = createMediaApi(mockDb, mockStorage);
    await api.update("m1", { altText: "Blazing logo", tags: ["brand"] });
    const args = vi.mocked(firestore.updateDoc).mock.calls[0];
    expect(args[0]).toMatchObject({ id: "auto-id" });
    const data = args[1] as Record<string, unknown>;
    expect(data.altText).toBe("Blazing logo");
    expect(data.tags).toEqual(["brand"]);
    expect(data.updatedAt).toBeDefined();
  });

  it("replace uploads a new file and preserves the existing id and metadata", async () => {
    vi.mocked(firestore.getDoc).mockResolvedValue(
      makeSnap("m1", {
        altText: "keep me",
        name: "old.png",
        storagePath: "media/m1/old.png",
        url: "u",
      }) as never,
    );
    const api = createMediaApi(mockDb, mockStorage);
    const item = await api.replace("m1", makeFile("new.webp", "image/webp"));
    expect(item.id).toBe("m1");
    expect(item.altText).toBe("keep me");
    expect(item.url).toBe("https://download.example/logo.png");
    expect(item.storagePath).toBe("media/m1/new.webp");
  });

  it("replace throws when the media item does not exist", async () => {
    vi.mocked(firestore.getDoc).mockResolvedValue(makeSnap("missing", undefined) as never);
    const api = createMediaApi(mockDb, mockStorage);
    await expect(api.replace("missing", makeFile())).rejects.toThrow("Media not found");
  });

  it("remove deletes the storage object and the document", async () => {
    vi.mocked(firestore.getDoc).mockResolvedValue(
      makeSnap("m1", { name: "a.png", storagePath: "media/m1/a.png", url: "u" }) as never,
    );
    const api = createMediaApi(mockDb, mockStorage);
    await api.remove("m1");
    expect(storage.deleteObject).toHaveBeenCalledWith({ path: "media/m1/a.png" });
    expect(firestore.deleteDoc).toHaveBeenCalled();
  });

  it("remove tolerates a missing storage object", async () => {
    vi.mocked(firestore.getDoc).mockResolvedValue(
      makeSnap("m1", { name: "a.png", url: "u" }) as never,
    );
    const api = createMediaApi(mockDb, mockStorage);
    await expect(api.remove("m1")).resolves.toBeUndefined();
  });

  it("usage reports counts for collections that reference the id", async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [
        makeSnap("e1", { image: "m1", title: "A" }),
        makeSnap("e2", { image: "other", title: "B" }),
      ],
    } as never);
    const api = createMediaApi(mockDb, mockStorage);
    const usage = await api.usage("m1", ["posts"]);
    expect(usage).toEqual([{ collection: "posts", count: 1 }]);
  });

  it("folders.create creates a folder via addDoc", async () => {
    const api = createMediaApi(mockDb, mockStorage);
    const folder = await api.folders.create("Banners", null);
    expect(folder.id).toBe("folder-id");
    expect(folder.name).toBe("Banners");
    expect(folder.parent).toBeNull();
    expect(firestore.addDoc).toHaveBeenCalled();
  });

  it("folders.list maps folder documents", async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [makeSnap("f1", { createdAt: "2026-01-01", name: "Banners", parent: null })],
    } as never);
    const api = createMediaApi(mockDb, mockStorage);
    const folders = await api.folders.list();
    expect(folders).toEqual([{ createdAt: "2026-01-01", id: "f1", name: "Banners", parent: null }]);
  });

  it("folders.rename updates the folder name", async () => {
    const api = createMediaApi(mockDb, mockStorage);
    await api.folders.rename("f1", "Heroes");
    const data = vi.mocked(firestore.updateDoc).mock.calls[0][1] as Record<string, unknown>;
    expect(data.name).toBe("Heroes");
  });

  it("folders.remove clears the folder on its media then deletes the folder", async () => {
    vi.mocked(firestore.getDocs).mockResolvedValue({
      docs: [makeSnap("m1", { folder: "f1" }), makeSnap("m2", { folder: "f1" })],
    } as never);
    const api = createMediaApi(mockDb, mockStorage);
    await api.folders.remove("f1");
    const batch = vi.mocked(firestore.writeBatch).mock.results[0].value;
    expect(batch.update).toHaveBeenCalledTimes(2);
    expect(batch.delete).toHaveBeenCalledTimes(1);
    expect(batch.commit).toHaveBeenCalled();
  });
});

describe("referencesValue", () => {
  it("finds direct string matches and nested references", () => {
    expect(referencesValue("media/m1", "m1")).toBe(true);
    expect(referencesValue({ banner: { url: "https://x/m1" } }, "m1")).toBe(true);
    expect(referencesValue(["a", { image: "m1" }], "m1")).toBe(true);
    expect(referencesValue("other", "m1")).toBe(false);
    expect(referencesValue(42, "m1")).toBe(false);
  });
});
