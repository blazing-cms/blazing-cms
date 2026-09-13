import { useQuery } from "@tanstack/react-query";
import { createRoute, Link } from "@tanstack/react-router";
import { Download, Plus, FileText, ChevronDown } from "lucide-react";
import { useState } from "react";

import { collections, components, globals } from "@/__generated__/schema-registry";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  assembleDocument,
  buildFieldSources,
  downloadDocument,
  exportCollection,
  type ExportFormat,
} from "@/lib/import-export";
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
  const { addToast } = useToast();
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

  const [exporting, setExporting] = useState(false);
  const fields = buildFieldSources({ collections, components, globals });

  async function handleExport(format: ExportFormat = "json") {
    setExporting(true);
    try {
      const rows = await exportCollection(provider, slug, fields);
      const doc = assembleDocument({ collections: { [slug]: rows }, globals: {} });
      const filename = `${slug}-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadDocument(doc, filename, format);
      addToast({
        description: `Exported ${rows.length} entry(ies) from "${slug}" as ${format.toUpperCase()}.`,
        title: "Exported",
      });
    } catch (err) {
      addToast({ description: String(err), title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Download className="mr-1 h-4 w-4" />
                {exporting ? "Exporting..." : "Export"}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => void handleExport("json")}>JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExport("csv")}>CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExport("xml")}>XML</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate ? (
            <Link to="/collections/new/$slug" params={{ slug }}>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> New Entry
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Link
              key={entry.id as string}
              to="/collections/$slug/$id"
              params={{ id: entry.id as string, slug }}
            >
              <div className="flex items-center justify-between rounded-md border p-3 hover:bg-muted">
                <div>
                  <p className="font-medium">
                    {((entry as Record<string, unknown>).title as string) ?? String(entry.id)}
                  </p>
                  <p className="text-sm text-muted-foreground">/{String(entry.id)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">No entries yet.</p>
        </div>
      )}
    </div>
  );
}
