import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  cert: vi.fn(),
  getUser: vi.fn(),
  getUserByEmail: vi.fn(),
  initializeApp: vi.fn(() => ({ name: "test-app" })),
  setCustomUserClaims: vi.fn(),
}));

vi.mock("firebase-admin/app", () => ({
  cert: h.cert,
  initializeApp: h.initializeApp,
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    getUser: h.getUser,
    getUserByEmail: h.getUserByEmail,
    setCustomUserClaims: h.setCustomUserClaims,
  }),
}));

import { parsePromoteArgs, promote } from "../commands/promote";

function user(
  overrides: Partial<{ uid: string; email?: string; customClaims?: Record<string, unknown> }> = {},
) {
  return { customClaims: {}, email: "u@example.com", uid: "uid-1", ...overrides };
}

describe("parsePromoteArgs", () => {
  it("parses positional user and flags", () => {
    expect(parsePromoteArgs(["promote", "a@b.com", "--check", "--project", "p1"])).toEqual({
      check: true,
      project: "p1",
      user: "a@b.com",
    });
  });

  it("does not treat flag values as the user", () => {
    expect(parsePromoteArgs(["promote", "--project", "p1"]).user).toBeUndefined();
  });

  it("defaults to non-check mode", () => {
    expect(parsePromoteArgs(["promote", "uid-9"])).toEqual({
      check: false,
      project: undefined,
      user: "uid-9",
    });
  });
});

describe("promote", () => {
  let exitError: Error | null;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      exitError = new Error(`exit:${code}`);
      throw exitError;
    }) as never);
    exitError = null;
    h.getUser.mockReset();
    h.getUserByEmail.mockReset();
    h.setCustomUserClaims.mockReset();
    h.initializeApp.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exits when no user is provided", async () => {
    await expect(promote({})).rejects.toThrow("exit:1");
    expect(h.initializeApp).not.toHaveBeenCalled();
  });

  it("resolves users by email and reports admin status in check mode", async () => {
    h.getUserByEmail.mockResolvedValue(user({ customClaims: { role: "admin" } }));
    await promote({ check: true, user: "u@example.com" });
    expect(exitError).toBeNull();
    expect(h.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it("check mode exits 1 when the user is not admin", async () => {
    h.getUser.mockResolvedValue(user({ email: undefined }));
    await expect(promote({ check: true, user: "uid-1" })).rejects.toThrow("exit:1");
  });

  it("skips promotion when the user is already admin", async () => {
    h.getUserByEmail.mockResolvedValue(user({ customClaims: { role: "admin" } }));
    await promote({ user: "u@example.com" });
    expect(h.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it("sets the admin claim while preserving existing claims", async () => {
    h.getUserByEmail.mockResolvedValue(user({ customClaims: { plan: "pro" } }));
    await promote({ project: "proj", user: "u@example.com" });
    expect(h.setCustomUserClaims).toHaveBeenCalledWith("uid-1", { plan: "pro", role: "admin" });
  });
});
