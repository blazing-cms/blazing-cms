import { describe, expect, it } from "vitest";

import {
  ADMIN_ROLE_CLAIM,
  ADMIN_ROLE_VALUE,
  UNKNOWN_ADMIN_STATUS,
  adminClaimStatus,
  adminPromotionClaims,
  isAdminClaim,
  loadAdminClaim,
  type IdTokenUserLike,
} from "./admin-claims";

describe("isAdminClaim", () => {
  it("returns true for role claim set to admin", () => {
    expect(isAdminClaim({ role: "admin" })).toBe(true);
  });

  it("returns true for boolean admin shorthand", () => {
    expect(isAdminClaim({ admin: true })).toBe(true);
  });

  it("rejects other roles", () => {
    expect(isAdminClaim({ role: "editor" })).toBe(false);
  });

  it("rejects non-boolean admin values", () => {
    expect(isAdminClaim({ admin: "yes" })).toBe(false);
    expect(isAdminClaim({ admin: false })).toBe(false);
  });

  it("handles missing claims", () => {
    expect(isAdminClaim(undefined)).toBe(false);
    expect(isAdminClaim(null)).toBe(false);
    expect(isAdminClaim({})).toBe(false);
  });
});

describe("adminClaimStatus", () => {
  it("reports admin status", () => {
    expect(adminClaimStatus({ role: "admin" })).toBe("admin");
    expect(adminClaimStatus({})).toBe("not-admin");
  });
});

describe("adminPromotionClaims", () => {
  it("preserves existing claims and sets the admin role", () => {
    const next = adminPromotionClaims({ [ADMIN_ROLE_CLAIM]: "editor", plan: "pro" });
    expect(next).toEqual({ [ADMIN_ROLE_CLAIM]: ADMIN_ROLE_VALUE, plan: "pro" });
  });

  it("starts from an empty claim set", () => {
    expect(adminPromotionClaims({})).toEqual({ [ADMIN_ROLE_CLAIM]: ADMIN_ROLE_VALUE });
  });
});

function makeUser({
  cached,
  refreshed,
  refreshError,
}: {
  cached?: Record<string, unknown>;
  refreshed?: Record<string, unknown>;
  refreshError?: Error;
}): IdTokenUserLike {
  const calls: boolean[] = [];
  return {
    getIdTokenResult: async (forceRefresh = false) => {
      calls.push(forceRefresh);
      if (forceRefresh && refreshError) throw refreshError;
      return { claims: forceRefresh ? (refreshed ?? {}) : (cached ?? {}), token: "tok" };
    },
  };
}

describe("loadAdminClaim", () => {
  it("returns admin from the cached token without refreshing", async () => {
    const user = makeUser({ cached: { role: "admin" } });
    await expect(loadAdminClaim(user)).resolves.toBe("admin");
  });

  it("returns not-admin when cached token lacks the claim", async () => {
    const user = makeUser({ cached: {} });
    await expect(loadAdminClaim(user)).resolves.toBe("not-admin");
  });

  it("escalates to a force refresh when the cached token is not admin", async () => {
    const user = makeUser({ cached: {}, refreshed: { role: "admin" } });
    await expect(loadAdminClaim(user)).resolves.toBe("admin");
  });

  it("returns the cached verdict when a force refresh fails", async () => {
    const user = makeUser({ cached: { role: "admin" }, refreshError: new Error("offline") });
    await expect(loadAdminClaim(user)).resolves.toBe("admin");
  });

  it("returns unknown when no claims can be read at all", async () => {
    const user = {
      getIdTokenResult: async () => {
        throw new Error("offline");
      },
    };
    await expect(loadAdminClaim(user)).resolves.toBe(UNKNOWN_ADMIN_STATUS);
  });

  it("returns not-admin for no user", async () => {
    await expect(loadAdminClaim(null)).resolves.toBe("not-admin");
    await expect(loadAdminClaim(undefined)).resolves.toBe("not-admin");
  });
});
