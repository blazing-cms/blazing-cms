import { describe, expect, it } from "vitest";

import {
  ADMIN_ROLE_CLAIM,
  ADMIN_ROLE_VALUE,
  adminClaimStatus,
  adminPromotionClaims,
  isAdminClaim,
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
