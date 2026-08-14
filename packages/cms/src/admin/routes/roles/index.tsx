import { useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Plus, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataProvider } from "@/lib/providers/context";
import { expandRolePermissions, normalizePermissions, usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const rolesIndexRoute = createRoute({
  component: RolesList,
  getParentRoute: () => appLayoutRoute,
  path: "/roles",
});

function RoleSummary({ permissions }: { permissions: unknown }) {
  const grants = expandRolePermissions(normalizePermissions(permissions));
  const system = grants.filter((g) => g.startsWith("system:"));
  const collections = grants.filter((g) => g.startsWith("collections:"));
  const parts: string[] = [];
  if (grants.includes("*:*")) parts.push("Super admin");
  if (system.length > 0) parts.push(`${system.length} system`);
  if (collections.length > 0) parts.push(`${collections.length} collection grants`);
  return <p className="text-xs text-muted-foreground">{parts.join(" · ") || "No permissions"}</p>;
}

function RolesList() {
  const provider = useDataProvider();
  const { canSystem } = usePermissions();
  const canManage = canSystem("manageRoles");

  const { data: roles, isLoading } = useQuery({
    queryFn: async () => {
      const result = await provider.findMany("roles", { limit: 50 });
      return result.data;
    },
    queryKey: ["roles"],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Roles</h1>
        {canManage ? (
          <Link to="/roles/new">
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New Role
            </Button>
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : roles && roles.length > 0 ? (
        <div className="space-y-2">
          {roles.map((role) => {
            const id = role.id as string;
            return (
              <Link key={id} to="/roles/$id" params={{ id }}>
                <Card className="cursor-pointer transition-colors hover:bg-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{String(role.name ?? id)}</p>
                      {role.description ? (
                        <p className="text-sm text-muted-foreground">{String(role.description)}</p>
                      ) : null}
                      <RoleSummary permissions={role.permissions} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No roles found</h2>
          <p className="text-muted-foreground">Create your first role to get started.</p>
        </div>
      )}
    </div>
  );
}
