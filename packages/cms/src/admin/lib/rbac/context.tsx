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

import {
  bootstrapAdminGrants,
  expandRolePermissions,
  hasGrant,
  hasSystemGrant,
  mergeGrants,
  normalizePermissions,
  roleIdsFromRecords,
} from "./permissions";

interface RbacContextValue {
  grants: string[];
  roleIds: string[];
  loading: boolean;
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

async function loadGrants(
  provider: DataProvider,
  userId: string,
): Promise<{ grants: string[]; roleIds: string[] }> {
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
  const [state, setState] = useState<{ grants: string[]; roleIds: string[] }>({
    grants: [],
    roleIds: [],
  });
  const [loading, setLoading] = useState(false);

  const userId = user?.uid ?? null;

  useEffect(() => {
    let cancelled = false;
    setState({ grants: [], roleIds: [] });
    if (!userId) return;
    setLoading(true);
    void loadGrants(provider, userId)
      .then((result) => {
        if (cancelled) return;
        setState(result);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const result = await loadGrants(provider, userId);
    setState(result);
  }, [provider, userId]);

  const value = useMemo<RbacContextValue>(
    () => ({
      can: (action, resource) => hasGrant(state.grants, action, resource),
      canSystem: (action) => hasSystemGrant(state.grants, action),
      grants: state.grants,
      loading,
      refresh,
      roleIds: state.roleIds,
    }),
    [loading, refresh, state.grants, state.roleIds],
  );

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}
