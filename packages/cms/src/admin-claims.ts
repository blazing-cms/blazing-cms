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

/** Shape of the auth token result used to read custom claims on the client. */
interface IdTokenResultLike {
  claims: Record<string, unknown>;
  token?: string;
}

export interface IdTokenUserLike {
  getIdTokenResult: (forceRefresh?: boolean) => Promise<IdTokenResultLike>;
}

/** Sentinel meaning "no claims could be read", distinct from "not admin". */
export const UNKNOWN_ADMIN_STATUS: unique symbol = Symbol.for("blazing-cms.unknown-admin");

export type AdminClaim = "admin" | "not-admin" | typeof UNKNOWN_ADMIN_STATUS;

async function tokenClaims(
  user: IdTokenUserLike,
  forceRefresh: boolean,
): Promise<Record<string, unknown>> {
  const result = await user.getIdTokenResult(forceRefresh);
  return (result?.claims ?? {}) as Record<string, unknown>;
}

/**
 * Resolve whether the signed-in user holds the admin role from their ID token.
 *
 * Reads the cached token first (no network round-trip) and only force-refreshes
 * as an escalation, so a temporarily failing refresh can no longer mask an
 * admin claim that is already present locally. Returns {@link UNKNOWN_ADMIN_STATUS}
 * when no claims could be read at all, letting callers distinguish "denied"
 * from "could not determine" instead of silently treating an error as `false`.
 */
export async function loadAdminClaim(
  user: IdTokenUserLike | null | undefined,
): Promise<AdminClaim> {
  if (!user) return "not-admin";

  const read = (forceRefresh: boolean) =>
    tokenClaims(user, forceRefresh).then((claims) =>
      isAdminClaim(claims) ? ("admin" as const) : ("not-admin" as const),
    );

  try {
    const cached = await read(false);
    if (cached === "admin") return cached;
    try {
      return await read(true);
    } catch {
      return cached;
    }
  } catch {
    return UNKNOWN_ADMIN_STATUS;
  }
}

/** Claims to merge onto an existing claim set when promoting to admin. */
export function adminPromotionClaims(existing: Record<string, unknown>): Record<string, unknown> {
  return { ...existing, [ADMIN_ROLE_CLAIM]: ADMIN_ROLE_VALUE };
}
