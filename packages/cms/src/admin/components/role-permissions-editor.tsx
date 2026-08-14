import type { RolePermissions } from "@/lib/rbac";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ALL_COLLECTIONS, COLLECTION_ACTIONS, SYSTEM_ACTIONS } from "@/lib/rbac";
import { setCollectionAction, setSystemFlag } from "@/lib/rbac";

interface RolePermissionsEditorProps {
  collectionSlugs: string[];
  onChange: (permissions: RolePermissions) => void;
  value: RolePermissions;
}

function SystemPermissions({
  onChange,
  value,
}: {
  onChange: (p: RolePermissions) => void;
  value: RolePermissions;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System</p>
      {[...SYSTEM_ACTIONS, "superAdmin" as const].map((action) => (
        <div key={action} className="flex items-center gap-2">
          <Checkbox
            checked={value.system[action] === true}
            id={`system-${action}`}
            onChange={(e) => onChange(setSystemFlag(value, action, e.target.checked))}
          />
          <Label htmlFor={`system-${action}`} className="font-normal">
            {action}
          </Label>
        </div>
      ))}
    </div>
  );
}

export function RolePermissionsEditor({
  collectionSlugs,
  onChange,
  value,
}: RolePermissionsEditorProps) {
  const slugs = [ALL_COLLECTIONS, ...collectionSlugs];

  return (
    <Card>
      <CardContent className="space-y-6 p-4">
        <SystemPermissions onChange={onChange} value={value} />
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Collections
          </p>
          {slugs.map((slug) => (
            <div key={slug} className="space-y-1">
              <p className="text-sm font-medium">
                {slug === ALL_COLLECTIONS ? "All collections" : slug}
              </p>
              <div className="flex flex-wrap gap-4">
                {COLLECTION_ACTIONS.map((action) => (
                  <div key={action} className="flex items-center gap-2">
                    <Checkbox
                      checked={value.collections[slug]?.[action] === true}
                      id={`${slug}-${action}`}
                      onChange={(e) =>
                        onChange(setCollectionAction(value, slug, action, e.target.checked))
                      }
                    />
                    <Label htmlFor={`${slug}-${action}`} className="font-normal">
                      {action}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
