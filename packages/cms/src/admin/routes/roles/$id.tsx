import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";

import type { RolePermissions } from "@/lib/rbac";

import { collections } from "@/__generated__/schema-registry";
import { DeniedNotice } from "@/components/denied-notice";
import { RolePermissionsEditor } from "@/components/role-permissions-editor";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmDelete } from "@/lib/hooks/use-confirm-delete";
import { useDataProvider } from "@/lib/providers/context";
import { emptyPermissions, normalizePermissions, usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const roleDetailRoute = createRoute({
  component: RoleDetail,
  getParentRoute: () => appLayoutRoute,
  path: "/roles/$id",
});

function RoleDetail() {
  const { id } = roleDetailRoute.useParams();
  const router = useRouter();
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { canSystem } = usePermissions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<RolePermissions>(emptyPermissions());
  const [saving, setSaving] = useState(false);

  const { data: role, isLoading } = useQuery({
    queryFn: async () => provider.findOne("roles", id),
    queryKey: ["roles", id],
  });

  const confirmDelete = useConfirmDelete();
  const canManage = canSystem("manageRoles");
  const collectionSlugs = collections.map((c) => c.slug);

  useEffect(() => {
    if (!role) return;
    if (role.name) setName(role.name as string);
    if (role.description) setDescription(role.description as string);
    setPermissions(normalizePermissions(role.permissions));
  }, [role]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await provider.update("roles", id, { description, name, permissions });
      addToast({ description: "Role has been updated.", title: "Saved" });
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const deleted = await confirmDelete({
      description: "Role has been deleted.",
      id,
      message: "Delete this role? Users assigned to it will lose its permissions.",
      onDelete: (itemId) => provider.delete("roles", itemId),
      queryKey: "roles",
      toastTitle: "Deleted",
    });
    if (deleted) router.navigate({ to: "/roles" });
  }

  if (!canManage) {
    return <DeniedNotice action="update" resource="roles" />;
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
          <h1 className="text-3xl font-bold">Edit Role</h1>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-1 h-4 w-4" /> Delete
        </Button>
      </div>

      {isLoading ? (
        <div className="max-w-md space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="max-w-2xl space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <RolePermissionsEditor
            collectionSlugs={collectionSlugs}
            onChange={setPermissions}
            value={permissions}
          />
          <Button type="submit" disabled={saving}>
            <Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save"}
          </Button>
        </form>
      )}
    </div>
  );
}
