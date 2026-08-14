import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";

import { DeniedNotice } from "@/components/denied-notice";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmDelete } from "@/lib/hooks/use-confirm-delete";
import { useDataProvider } from "@/lib/providers/context";
import { saveUserRoles, usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const userDetailRoute = createRoute({
  component: UserDetail,
  getParentRoute: () => appLayoutRoute,
  path: "/users/$id",
});

function UserDetail() {
  const { id } = userDetailRoute.useParams();
  const router = useRouter();
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { canSystem } = usePermissions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryFn: async () => provider.findOne("users", id),
    queryKey: ["users", id],
  });

  const { data: userRoles } = useQuery({
    queryFn: async () => provider.findOne("user_roles", id),
    queryKey: ["user_roles", id],
  });

  const { data: roles } = useQuery({
    queryFn: async () => {
      const result = await provider.findMany("roles", { limit: 100 });
      return result.data;
    },
    queryKey: ["roles"],
  });

  const confirmDelete = useConfirmDelete();
  const canManage = canSystem("manageUsers");

  useEffect(() => {
    if (!user) return;
    if (user.name) setName(user.name as string);
    if (user.email) setEmail(user.email as string);
  }, [user]);

  useEffect(() => {
    if (userRoles && Array.isArray(userRoles.roleIds)) {
      setRoleIds((userRoles.roleIds as string[]).filter((r) => typeof r === "string"));
    }
  }, [userRoles]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await provider.update("users", id, { email, name });
      await saveUserRoles(provider, id, roleIds);
      addToast({ description: "User has been updated.", title: "Saved" });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["user_roles"] });
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const deleted = await confirmDelete({
      description: "User has been deleted.",
      id,
      message: "Delete this user? This action cannot be undone.",
      onDelete: async (itemId) => {
        await provider.delete("users", itemId);
        await provider.delete("user_roles", itemId);
      },
      queryKey: "users",
      toastTitle: "Deleted",
    });
    if (deleted) router.navigate({ to: "/users" });
  }

  if (!canManage) {
    return <DeniedNotice action="update" resource="users" />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.history.back()}
            className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold">Edit User</h1>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
          <Button onClick={handleSave} disabled={saving || isLoading}>
            <Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-md space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Roles
              </p>
              {roles && roles.length > 0 ? (
                roles.map((role) => {
                  const roleId = role.id as string;
                  return (
                    <div key={roleId} className="flex items-center gap-2">
                      <Checkbox
                        checked={roleIds.includes(roleId)}
                        id={`role-${roleId}`}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleIds((prev) =>
                              prev.includes(roleId) ? prev : [...prev, roleId],
                            );
                          } else {
                            setRoleIds((prev) => prev.filter((r) => r !== roleId));
                          }
                        }}
                      />
                      <Label htmlFor={`role-${roleId}`} className="font-normal">
                        {String(role.name ?? roleId)}
                      </Label>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No roles defined yet.</p>
              )}
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
