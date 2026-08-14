import { createRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { collections } from "@/__generated__/schema-registry";
import { DeniedNotice } from "@/components/denied-notice";
import { FeatureDisabledNotice } from "@/components/feature-disabled-notice";
import { VersionPanel } from "@/components/version-panel";
import { collectionFeatureEnabled } from "@/lib/features";
import { usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const entryRevisionsRoute = createRoute({
  component: EntryRevisions,
  getParentRoute: () => appLayoutRoute,
  path: "/collections/$slug/$id/revisions",
});

function EntryRevisions() {
  const { id, slug } = entryRevisionsRoute.useParams();
  const router = useRouter();
  const { can } = usePermissions();
  const col = collections.find((c) => c.slug === slug);

  if (!can("read", slug)) {
    return <DeniedNotice action="read" resource={slug} />;
  }

  if (!collectionFeatureEnabled(slug, "versioning")) {
    return (
      <FeatureDisabledNotice
        title="Version history is disabled"
        description="The versioning capability is turned off for this collection."
      />
    );
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
        <h1 className="text-3xl font-bold">Revisions · {col?.labels?.singular ?? slug}</h1>
        <p className="text-muted-foreground text-sm">ID: {id}</p>
      </div>
      <VersionPanel standalone target={{ collection: slug, id, kind: "entry" }} />
    </div>
  );
}
