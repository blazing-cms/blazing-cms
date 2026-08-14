import { useQuery } from "@tanstack/react-query";
import { createRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useState, type FormEvent } from "react";

import { DeniedNotice } from "@/components/denied-notice";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDataProvider } from "@/lib/providers/context";
import { saveUserRoles, usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const newUserRoute = createRoute({
  component: NewUser,
  getParentRoute: () => appLayoutRoute,
  path: "/users/new",
});

function NewUser() {
  const router = useRouter();
  const provider = useDataProvider();
  const { addToast } = useToast();
  const { canSystem } = usePermissions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: roles } = useQuery({
    queryFn: async () => {
      const result = await provider.findMany("roles", { limit: 100 });
      return result.data;
    },
    queryKey: ["roles"],
  });

  const canManage = canSystem("manageUsers");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const userId = await provider.create("users", {
        createdAt: new Date().toISOString(),
        email,
        name,
      });
      await saveUserRoles(provider, userId, roleIds);
      addToast({ description: "User has been created.", title: "User created" });
      router.navigate({ to: "/users" });
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return <DeniedNotice action="create" resource="users" />;
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
        <h1 className="text-3xl font-bold">New User</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
                          setRoleIds((prev) => (prev.includes(roleId) ? prev : [...prev, roleId]));
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
        <Button type="submit" disabled={saving || !name.trim() || !email.trim()}>
          <Save className="mr-1 h-4 w-4" /> {saving ? "Creating..." : "Create User"}
        </Button>
      </form>
    </div>
  );
}
