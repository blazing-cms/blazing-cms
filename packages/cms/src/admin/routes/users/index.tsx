import { useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Plus, Users as UsersIcon } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataProvider } from "@/lib/providers/context";
import { usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const usersIndexRoute = createRoute({
  component: UsersList,
  getParentRoute: () => appLayoutRoute,
  path: "/users",
});

function roleNamesByUser(
  roles: Array<{ id: string; name: string }>,
  userRoles: Array<Record<string, unknown>>,
): Map<string, string[]> {
  const namesById = new Map(roles.map((role) => [role.id, role.name]));
  const result = new Map<string, string[]>();
  for (const record of userRoles) {
    const userId = record.userId as string | undefined;
    if (!userId || !Array.isArray(record.roleIds)) continue;
    const names = (record.roleIds as string[])
      .map((roleId) => namesById.get(roleId))
      .filter(Boolean) as string[];
    if (names.length > 0) result.set(userId, names);
  }
  return result;
}

function UsersList() {
  const provider = useDataProvider();
  const { canSystem } = usePermissions();
  const canManage = canSystem("manageUsers");

  const { data: users, isLoading } = useQuery({
    queryFn: async () => {
      const result = await provider.findMany("users", { limit: 50 });
      return result.data;
    },
    queryKey: ["users"],
  });

  const { data: roles } = useQuery({
    queryFn: async () => {
      const result = await provider.findMany("roles", { limit: 100 });
      return result.data;
    },
    queryKey: ["roles"],
  });

  const { data: userRoles } = useQuery({
    queryFn: async () => {
      const result = await provider.findMany("user_roles", { limit: 100 });
      return result.data;
    },
    queryKey: ["user_roles"],
  });

  const namesByUser = useMemo(
    () => roleNamesByUser((roles ?? []) as Array<{ id: string; name: string }>, userRoles ?? []),
    [roles, userRoles],
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        {canManage ? (
          <Link to="/users/new">
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New User
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
      ) : users && users.length > 0 ? (
        <div className="space-y-2">
          {users.map((user) => {
            const id = user.id as string;
            const names = namesByUser.get(id) ?? [];
            return (
              <Link key={id} to="/users/$id" params={{ id }}>
                <Card className="cursor-pointer transition-colors hover:bg-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <UsersIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{String(user.name ?? user.email ?? id)}</p>
                      {user.email ? (
                        <p className="text-sm text-muted-foreground">{String(user.email)}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-1">
                      {names.map((roleName) => (
                        <span
                          key={roleName}
                          className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                        >
                          {roleName}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <UsersIcon className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No users found</h2>
          <p className="text-muted-foreground">Create your first user to get started.</p>
        </div>
      )}
    </div>
  );
}
