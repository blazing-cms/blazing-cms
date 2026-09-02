import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { DataProvider } from "@/lib/providers/types";

import { useAuth } from "@/lib/auth";
import { useDataProvider } from "@/lib/providers/context";

import type { IdTokenUserLike } from "../../../admin-claims";

import { loadAdminClaim } from "../../../admin-claims";
import {
  bootstrapAdminGrants,
  expandRolePermissions,
  hasGrant,
  hasSystemGrant,
  mergeGrants,
  normalizePermissions,
  roleIdsFromRecords,
} from "./permissions";
import { SUPER_ADMIN_GRANT } from "./types";

interface RbacContextValue {
  grants: string[];
  roleIds: string[];
  loading: boolean;
  /** True when the signed-in user has the `role: "admin"` custom claim. */
  hasAdminRole: boolean;
  can: (action: string, resource: string) => boolean;
  canSystem: (action: string) => boolean;
  refresh: () => Promise<void>;
}

const RbacContext = createContext<RbacContextValue | null>(null);

export function usePermissions(): RbacContextValue {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error("usePermissions must be used within an RbacProvider");
  return ctx;
}

async function loadAdminClaimForUser(user: IdTokenUserLike): Promise<boolean> {
  return (await loadAdminClaim(user)) === "admin";
}

async function loadGrants(
  provider: DataProvider,
  userId: string,
  options: { adminClaim?: boolean } = {},
): Promise<{ grants: string[]; roleIds: string[] }> {
  if (options.adminClaim) {
    return { grants: [SUPER_ADMIN_GRANT], roleIds: [] };
  }
  const [userRoles, userRecord, rolesResult] = await Promise.all([
    provider.findOne("user_roles", userId),
    provider.findOne("users", userId),
    provider.findMany("roles", { limit: 100 }),
  ]);
  const roles = rolesResult.data as Array<{ id: string; name: string; permissions?: unknown }>;

  const bootstrapGrants = bootstrapAdminGrants(roles);
  if (bootstrapGrants.length > 0) {
    return { grants: bootstrapGrants, roleIds: [] };
  }

  const roleIds = roleIdsFromRecords(userRoles, userRecord, roles);

  const grants = roles
    .filter((role) => roleIds.includes(role.id))
    .flatMap((role) => expandRolePermissions(normalizePermissions(role.permissions)));
  return { grants: mergeGrants(grants), roleIds };
}

export function RbacProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const provider = useDataProvider();
  const [state, setState] = useState<{
    grants: string[];
    roleIds: string[];
    hasAdminRole: boolean;
  }>({
    grants: [],
    hasAdminRole: false,
    roleIds: [],
  });
  const [loading, setLoading] = useState(false);

  const userId = user?.uid ?? null;

  useEffect(() => {
    let cancelled = false;
    setState({ grants: [], hasAdminRole: false, roleIds: [] });
    if (!userId || !user) return;
    setLoading(true);
    void loadAdminClaimForUser(user)
      .then((adminClaim) =>
        loadGrants(provider, userId, { adminClaim }).then((grants) => ({ adminClaim, ...grants })),
      )
      .then((result) => {
        if (cancelled) return;
        setState({
          grants: result.grants,
          hasAdminRole: result.adminClaim,
          roleIds: result.roleIds,
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, user, userId]);

  const refresh = useCallback(async () => {
    if (!userId || !user) return;
    const adminClaim = await loadAdminClaimForUser(user);
    const result = await loadGrants(provider, userId, { adminClaim });
    setState({ grants: result.grants, hasAdminRole: adminClaim, roleIds: result.roleIds });
  }, [provider, user, userId]);

  const value = useMemo<RbacContextValue>(
    () => ({
      can: (action, resource) => hasGrant(state.grants, action, resource),
      canSystem: (action) => hasSystemGrant(state.grants, action),
      grants: state.grants,
      hasAdminRole: state.hasAdminRole,
      loading,
      refresh,
      roleIds: state.roleIds,
    }),
    [loading, refresh, state],
  );

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}
