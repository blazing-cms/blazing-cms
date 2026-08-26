import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  getIdTokenResult: vi.fn(),
  getUser: vi.fn(),
  getUserByEmail: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (u: unknown) => void) => {
    cb(null);
    return vi.fn();
  }),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: h.GoogleAuthProvider,
  onAuthStateChanged: h.onAuthStateChanged,
  signInWithEmailAndPassword: h.signInWithEmailAndPassword,
  signInWithPopup: h.signInWithPopup,
  signOut: h.signOut,
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock("@/components/toast-provider", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
  createRoute: vi.fn((opts: unknown) => opts),
  Outlet: () => null,
  useNavigate: () => vi.fn(),
}));

import { isAdminClaim } from "../admin-claims";

describe("admin claims integration", () => {
  it("recognizes role:admin claim", () => {
    expect(isAdminClaim({ role: "admin" })).toBe(true);
  });

  it("recognizes admin:true shorthand", () => {
    expect(isAdminClaim({ admin: true })).toBe(true);
  });

  it("rejects missing claim", () => {
    expect(isAdminClaim({})).toBe(false);
    expect(isAdminClaim(null)).toBe(false);
    expect(isAdminClaim(undefined)).toBe(false);
  });

  it("rejects wrong role value", () => {
    expect(isAdminClaim({ role: "editor" })).toBe(false);
  });
});

describe("GoogleAuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is imported from firebase/auth", async () => {
    const auth = await import("firebase/auth");
    expect(auth.GoogleAuthProvider).toBeDefined();
  });
});

describe("signInWithPopup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is available from firebase/auth", async () => {
    const auth = await import("firebase/auth");
    expect(auth.signInWithPopup).toBeDefined();
  });
});
