import { createRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useState, type FormEvent } from "react";

import { collections } from "@/__generated__/schema-registry";
import { DeniedNotice } from "@/components/denied-notice";
import { FieldInput } from "@/components/field-input";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { useDataProvider } from "@/lib/providers/context";
import { usePermissions } from "@/lib/rbac";
import { defaultWorkflowState, hasWorkflow } from "@/lib/workflow";
import { appLayoutRoute } from "@/routes/app-layout";

export const newEntryRoute = createRoute({
  component: NewEntry,
  getParentRoute: () => appLayoutRoute,
  path: "/collections/new/$slug",
});

function initialValues(col: ReturnType<typeof collections.find>): Record<string, unknown> {
  if (!col || !hasWorkflow(col)) return {};
  return { workflowState: defaultWorkflowState(col) };
}

function NewEntry() {
  const { slug } = newEntryRoute.useParams();
  const router = useRouter();
  const provider = useDataProvider();
  const { addToast } = useToast();
  const { can } = usePermissions();
  const col = collections.find((c) => c.slug === slug);
  const [values, setValues] = useState<Record<string, unknown>>(initialValues(col));
  const [saving, setSaving] = useState(false);

  if (!can("create", slug)) {
    return <DeniedNotice action="create" resource={slug} />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const id = await provider.create(slug, { createdAt: new Date().toISOString(), ...values });
      addToast({ description: "Your entry has been created.", title: "Entry created" });
      router.navigate({ params: { id, slug }, to: "/collections/$slug/$id" as string });
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-3xl font-bold">New {col?.labels?.singular ?? slug}</h1>
      </div>

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
          <Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
}
