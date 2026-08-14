import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApp = { name: "test-app" };
const mockAuthInstance = { currentUser: null };
const mockDb = {};
const mockStorage = {};

vi.mock("firebase/app", () => ({
  getApp: vi.fn(() => mockApp),
  initializeApp: vi.fn(() => mockApp),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => mockAuthInstance),
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (u: unknown) => void) => {
    cb(null);
    return () => {};
  }),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/firestore", () => {
  const mockDoc = vi.fn();
  const mockColRef = {};
  return {
    addDoc: vi.fn(),
    collection: vi.fn(() => mockColRef),
    deleteDoc: vi.fn(),
    doc: mockDoc,
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    getFirestore: vi.fn(() => mockDb),
    limit: vi.fn((n: number) => ({ limit: n })),
    orderBy: vi.fn((f: string, d: unknown) => ({ direction: d, field: f })),
    query: vi.fn((_ref: unknown, ...constraints: unknown[]) => ({ constraints, ref: _ref })),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    where: vi.fn((f: string, op: string, v: unknown) => ({ field: f, op, value: v })),
  };
});

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => mockStorage),
}));

const { initializeApp } = await import("firebase/app");
const authMod = await import("firebase/auth");
const fsMod = await import("firebase/firestore");

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("createBlazeClient", () => {
  it("initializes Firebase app and returns client", async () => {
    const { createBlazeClient } = await import("../client.js");
    const client = createBlazeClient({
      apiKey: "key",
      appId: "app-id",
      authDomain: "test.firebaseapp.com",
      projectId: "test",
      storageBucket: "test.appspot.com",
    });
    expect(initializeApp).toHaveBeenCalled();
    expect(client.app).toBe(mockApp);
    expect(client.db).toBe(mockDb);
    expect(client.storage).toBe(mockStorage);
    expect(client.auth).toBeDefined();
    expect(client.collection).toBeDefined();
    expect(client.globals).toBeDefined();
  });

  it("caches collection API instances", async () => {
    const { createBlazeClient } = await import("../client.js");
    const client = createBlazeClient({
      apiKey: "key",
      appId: "app-id",
      authDomain: "test.firebaseapp.com",
      projectId: "test",
      storageBucket: "test.appspot.com",
    });
    const a = client.collection("posts");
    const b = client.collection("posts");
    expect(a).toBe(b);
  });

  it("falls back to named instance when initializeApp throws", async () => {
    const { initializeApp } = await import("firebase/app");
    vi.mocked(initializeApp)
      .mockReset()
      .mockImplementationOnce(() => {
        throw new Error("already exists");
      })
      .mockReturnValueOnce(mockApp);
    const { createBlazeClient } = await import("../client.js");
    const client = createBlazeClient({
      apiKey: "key",
      appId: "app-id",
      authDomain: "test.firebaseapp.com",
      projectId: "test",
      storageBucket: "test.appspot.com",
    });
    expect(client.app).toBe(mockApp);
  });
});

describe("createAuthApi", () => {
  it("login calls signInWithEmailAndPassword", async () => {
    const mockUser = { uid: "u1" };
    vi.mocked(authMod.signInWithEmailAndPassword).mockResolvedValue({ user: mockUser } as never);
    const { createAuthApi } = await import("../auth.js");
    const api = createAuthApi(mockAuthInstance as never);
    const user = await api.login("test@test.com", "pass");
    expect(user).toBe(mockUser);
    expect(authMod.signInWithEmailAndPassword).toHaveBeenCalledWith(
      mockAuthInstance,
      "test@test.com",
      "pass",
    );
  });

  it("logout calls signOut", async () => {
    const { createAuthApi } = await import("../auth.js");
    const api = createAuthApi(mockAuthInstance as never);
    await api.logout();
    expect(authMod.signOut).toHaveBeenCalledWith(mockAuthInstance);
  });

  it("getCurrentUser returns auth.currentUser", async () => {
    const { createAuthApi } = await import("../auth.js");
    const api = createAuthApi(mockAuthInstance as never);
    expect(api.getCurrentUser()).toBeNull();
  });

  it("onAuthChange subscribes to auth state", async () => {
    const { createAuthApi } = await import("../auth.js");
    const api = createAuthApi(mockAuthInstance as never);
    const cb = vi.fn();
    const unsub = api.onAuthChange(cb);
    expect(authMod.onAuthStateChanged).toHaveBeenCalledWith(mockAuthInstance, cb);
    expect(typeof unsub).toBe("function");
  });
});

describe("createCollectionApi", () => {
  const makeSnap = (id: string, data?: Record<string, unknown>, exists = true) => ({
    data: () => data ?? null,
    exists: () => exists,
    id,
  });

  it("findById returns document data", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(makeSnap("doc-1", { title: "Hello" }) as never);
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    const result = await api.findById("doc-1");
    expect(result).toEqual({ id: "doc-1", title: "Hello" });
  });

  it("findById returns null when not found", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(makeSnap("missing", undefined, false) as never);
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    const result = await api.findById("missing");
    expect(result).toBeNull();
  });

  it("create generates id via addDoc when no id provided", async () => {
    vi.mocked(fsMod.addDoc).mockResolvedValue({ id: "new-id" } as never);
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    const id = await api.create({ title: "New" });
    expect(id).toBe("new-id");
    expect(fsMod.addDoc).toHaveBeenCalled();
  });

  it("create uses setDoc when id is provided", async () => {
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    const id = await api.create({ id: "custom-id", title: "New" });
    expect(id).toBe("custom-id");
    expect(fsMod.setDoc).toHaveBeenCalled();
    expect(fsMod.addDoc).not.toHaveBeenCalled();
  });

  it("update calls updateDoc without id field", async () => {
    vi.mocked(fsMod.getDoc).mockResolvedValue(makeSnap("doc-1", undefined, false) as never);
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    await api.update("doc-1", { id: "doc-1", title: "Updated" });
    expect(fsMod.updateDoc).toHaveBeenCalled();
    const args = vi.mocked(fsMod.updateDoc).mock.calls[0];
    const data = args[1] as Record<string, unknown>;
    expect(data).not.toHaveProperty("id");
    expect(data.title).toBe("Updated");
  });

  it("delete calls deleteDoc", async () => {
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    await api.delete("doc-1");
    expect(fsMod.deleteDoc).toHaveBeenCalled();
  });

  it("findMany applies filters, sorting, and limit", async () => {
    const snap = {
      docs: [{ data: () => ({ title: "A" }), exists: () => true, id: "1" }],
    };
    vi.mocked(fsMod.getDocs).mockResolvedValue(snap as never);
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    const result = await api.findMany({
      filters: [{ field: "status", op: "==", value: "published" }],
      limit: 10,
      orderBy: { direction: "desc", field: "createdAt" },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe("A");
    expect(fsMod.where).toHaveBeenCalledWith("status", "==", "published");
    expect(fsMod.orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(fsMod.limit).toHaveBeenCalledWith(11);
  });

  it("findMany handles pagination with hasMore", async () => {
    const docs = Array.from({ length: 26 }, (_, i) => ({
      data: () => ({ n: i }),
      exists: () => true,
      id: String(i),
    }));
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs } as never);
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    const result = await api.findMany({ limit: 25 });
    expect(result.data).toHaveLength(25);
    expect(result.hasMore).toBe(true);
    expect(result.cursor).toBe("24");
  });

  it("findMany handles end of results without hasMore", async () => {
    const docs = Array.from({ length: 10 }, (_, i) => ({
      data: () => ({ n: i }),
      exists: () => true,
      id: String(i),
    }));
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs } as never);
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    const result = await api.findMany({ limit: 25 });
    expect(result.data).toHaveLength(10);
    expect(result.hasMore).toBe(false);
  });

  it("findMany uses PAGE_SIZE when limit is 0", async () => {
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs: [] } as never);
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    const result = await api.findMany({ limit: 0 });
    expect(result.data).toEqual([]);
  });

  it("findMany defaults sort direction to asc", async () => {
    vi.mocked(fsMod.getDocs).mockResolvedValue({ docs: [] } as never);
    const { createCollectionApi } = await import("../collection.js");
    const api = createCollectionApi(mockDb as never, "posts");
    await api.findMany({ orderBy: { field: "title" } } as never);
    expect(fsMod.orderBy).toHaveBeenCalledWith("title", "asc");
  });
});

describe("createGlobalApi", () => {
  it("get returns document data", async () => {
    const snap = { data: () => ({ title: "Site" }), exists: () => true, id: "value" };
    vi.mocked(fsMod.getDoc).mockResolvedValue(snap as never);
    const { createGlobalApi } = await import("../global.js");
    const api = createGlobalApi(mockDb as never);
    const result = await api.get("site-settings");
    expect(result).toEqual({ id: "value", title: "Site" });
    expect(fsMod.doc).toHaveBeenCalledWith(mockDb, "globals_site-settings", "value");
  });

  it("get returns null when not found", async () => {
    const snap = { exists: () => false };
    vi.mocked(fsMod.getDoc).mockResolvedValue(snap as never);
    const { createGlobalApi } = await import("../global.js");
    const api = createGlobalApi(mockDb as never);
    const result = await api.get("missing");
    expect(result).toBeNull();
  });

  it("upsert calls setDoc with merge", async () => {
    const mockDocRef = { id: "value" };
    vi.mocked(fsMod.doc).mockReturnValue(mockDocRef as never);
    vi.mocked(fsMod.getDoc).mockResolvedValue({ exists: () => false } as never);
    const { createGlobalApi } = await import("../global.js");
    const api = createGlobalApi(mockDb as never);
    await api.upsert("site-settings", { title: "New Site" });
    expect(fsMod.setDoc).toHaveBeenCalledWith(mockDocRef, { title: "New Site" }, { merge: true });
  });
});
