import { createRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { RolePermissions } from "@/lib/rbac";

import { collections } from "@/__generated__/schema-registry";
import { DeniedNotice } from "@/components/denied-notice";
import { RolePermissionsEditor } from "@/components/role-permissions-editor";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDataProvider } from "@/lib/providers/context";
import { emptyPermissions, usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const newRoleRoute = createRoute({
  component: NewRole,
  getParentRoute: () => appLayoutRoute,
  path: "/roles/new",
});

function NewRole() {
  const router = useRouter();
  const provider = useDataProvider();
  const { addToast } = useToast();
  const { canSystem } = usePermissions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<RolePermissions>(emptyPermissions());
  const [saving, setSaving] = useState(false);

  const canManage = canSystem("manageRoles");
  const collectionSlugs = collections.map((c) => c.slug);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await provider.create("roles", {
        createdAt: new Date().toISOString(),
        description,
        name,
        permissions,
      });
      addToast({ description: "Role has been created.", title: "Role created" });
      router.navigate({ to: "/roles" });
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return <DeniedNotice action="create" resource="roles" />;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.history.back()}
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-3xl font-bold">New Role</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Role Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
        <Button type="submit" disabled={saving || !name.trim()}>
          <Save className="mr-1 h-4 w-4" /> {saving ? "Creating..." : "Create Role"}
        </Button>
      </form>
    </div>
  );
}
