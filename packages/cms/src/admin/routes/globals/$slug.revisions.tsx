import { createRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { globals } from "@/__generated__/schema-registry";
import { FeatureDisabledNotice } from "@/components/feature-disabled-notice";
import { VersionPanel } from "@/components/version-panel";
import { globalFeatureEnabled } from "@/lib/features";
import { appLayoutRoute } from "@/routes/app-layout";

export const globalRevisionsRoute = createRoute({
  component: GlobalRevisions,
  getParentRoute: () => appLayoutRoute,
  path: "/globals/$slug/revisions",
});

function GlobalRevisions() {
  const { slug } = globalRevisionsRoute.useParams();
  const router = useRouter();
  const globalDef = globals.find((g) => g.slug === slug);

  if (!globalFeatureEnabled(slug, "versioning")) {
    return (
      <FeatureDisabledNotice
        title="Version history is disabled"
        description="The versioning capability is turned off."
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
        <h1 className="text-3xl font-bold">Revisions · {globalDef?.label ?? slug}</h1>
        <p className="text-muted-foreground text-sm">/{slug}</p>
      </div>
      <VersionPanel standalone target={{ kind: "global", slug }} />
    </div>
  );
}
