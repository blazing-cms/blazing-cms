import { useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Plus, FileText } from "lucide-react";

import { collections } from "@/__generated__/schema-registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataProvider } from "@/lib/providers/context";
import { usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const collectionDetailRoute = createRoute({
  component: CollectionEntries,
  getParentRoute: () => appLayoutRoute,
  path: "/collections/$slug",
});

function CollectionEntries() {
  const { slug } = collectionDetailRoute.useParams();
  const provider = useDataProvider();
  const { can } = usePermissions();
  const col = collections.find((c) => c.slug === slug);
  const canCreate = can("create", slug);

  const { data: entries, isLoading } = useQuery({
    queryFn: async () => {
      const result = await provider.findMany(slug, { limit: 50 });
      return result.data;
    },
    queryKey: ["collection", slug],
  });

  if (!col) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Collection not found</h2>
        <p className="text-muted-foreground">Collection "{slug}" is not defined in your schema.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{col.labels?.singular ?? slug}</h1>
          <p className="text-muted-foreground text-sm">/{slug}</p>
        </div>
        {canCreate ? (
          <Link to="/collections/new/$slug" params={{ slug }}>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New Entry
            </Button>
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="rounded-md border">
          {entries.map((entry) => {
            const titleField = col.admin?.useAsTitle ?? "title";
            const title =
              (entry[titleField] as string) ??
              (entry.title as string) ??
              (entry.name as string) ??
              (entry.slug as string) ??
              (entry.id as string);
            const status = entry.status as string | undefined;
            return (
              <Link
                key={entry.id as string}
                to={"/collections/$slug/$id" as string}
                params={{ id: entry.id as string, slug } as Record<string, string>}
                className="flex items-center justify-between border-b px-4 py-3 transition-colors hover:bg-accent last:border-b-0"
              >
                <span className="font-medium">{String(title)}</span>
                {status ? (
                  <Badge variant={status === "published" ? "default" : "secondary"}>{status}</Badge>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No entries yet</h2>
          <p className="text-muted-foreground">Create your first entry to get started.</p>
        </div>
      )}
    </div>
  );
}
