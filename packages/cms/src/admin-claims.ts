export const ADMIN_ROLE_CLAIM = "role";
export const ADMIN_ROLE_VALUE = "admin";

export type AdminClaimStatus = "admin" | "not-admin";

/**
 * Check whether a set of Firebase custom claims grants the admin role.
 * Accepts either `role: "admin"` or the boolean shorthand `admin: true`.
 */
export function isAdminClaim(claims: Record<string, unknown> | undefined | null): boolean {
  if (!claims) return false;
  if (claims[ADMIN_ROLE_CLAIM] === ADMIN_ROLE_VALUE) return true;
  return claims.admin === true;
}

export function adminClaimStatus(
  claims: Record<string, unknown> | undefined | null,
): AdminClaimStatus {
  return isAdminClaim(claims) ? "admin" : "not-admin";
}

/** Claims to merge onto an existing claim set when promoting to admin. */
export function adminPromotionClaims(existing: Record<string, unknown>): Record<string, unknown> {
  return { ...existing, [ADMIN_ROLE_CLAIM]: ADMIN_ROLE_VALUE };
}
