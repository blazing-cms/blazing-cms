import type { CollectionDefinition } from "@blazing-cms/types";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, History, Save } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";

import { collections } from "@/__generated__/schema-registry";
import { DeniedNotice } from "@/components/denied-notice";
import { FieldInput } from "@/components/field-input";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowPanel } from "@/components/workflow-panel";
import { collectionFeatureEnabled } from "@/lib/features";
import { useDataProvider } from "@/lib/providers/context";
import { usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const editEntryRoute = createRoute({
  component: EditEntry,
  getParentRoute: () => appLayoutRoute,
  path: "/collections/$slug/$id",
});

function entryLabel(col: CollectionDefinition | undefined, slug: string): string {
  return col?.labels?.singular ?? slug;
}

function saveButtonLabel(saving: boolean): string {
  return saving ? "Saving..." : "Save";
}

function EditEntry() {
  const { id, slug } = editEntryRoute.useParams();
  const router = useRouter();
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const col = collections.find((c) => c.slug === slug);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const canUpdate = can("update", slug);

  const { data: entry, isLoading } = useQuery({
    queryFn: async () => provider.findOne(slug, id),
    queryKey: ["collection", slug, id],
  });

  useEffect(() => {
    if (entry) setValues(entry);
  }, [entry]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await provider.update(slug, id, values);
      addToast({ description: "Entry has been updated.", title: "Saved" });
      await queryClient.invalidateQueries({ queryKey: ["collection", slug] });
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const label = entryLabel(col, slug);
  const versioningEnabled = collectionFeatureEnabled(slug, "versioning");
  const workflowEnabled = collectionFeatureEnabled(slug, "workflow");

  if (!canUpdate) {
    return <DeniedNotice action="update" resource={slug} />;
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Edit {label}</h1>
            <p className="text-muted-foreground text-sm">ID: {id}</p>
          </div>
          {versioningEnabled && (
            <Link
              to={"/collections/$slug/$id/revisions" as string}
              params={{ id, slug } as Record<string, string>}
            >
              <Button type="button" variant="outline" size="sm">
                <History className="mr-1 h-4 w-4" /> Version History
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-lg space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
          <Skeleton className="h-10 w-24" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          {col?.fields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
            />
          ))}
          <Button type="submit" disabled={saving}>
            <Save className="mr-1 h-4 w-4" /> {saveButtonLabel(saving)}
          </Button>
        </form>
      )}
      {col && entry && workflowEnabled && (
        <WorkflowPanel col={col} entry={entry} id={id} slug={slug} />
      )}
    </div>
  );
}
