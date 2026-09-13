import { useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { Download, Upload, FileJson, ChevronDown } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { collections, components, globals } from "@/__generated__/schema-registry";
import { useToast } from "@/components/toast-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildExport,
  buildFieldSources,
  detectFormat,
  downloadDocument,
  importDocument,
  parseImportFile,
  type ExportFormat,
  type ImportProgress,
  type ImportResult,
} from "@/lib/import-export";
import { useDataProvider } from "@/lib/providers/context";
import { appLayoutRoute } from "@/routes/app-layout";

export const contentToolsRoute = createRoute({
  component: ContentTools,
  getParentRoute: () => appLayoutRoute,
  path: "/settings/content",
});

function ContentTools() {
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fields = buildFieldSources({ collections, components, globals });

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);

  async function handleExport(format: ExportFormat = "json") {
    setExporting(true);
    try {
      const doc = await buildExport(provider, fields);
      const filename = `content-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadDocument(doc, filename, format);
      addToast({ description: `Content exported as ${format.toUpperCase()}.`, title: "Exported" });
    } catch (err) {
      addToast({ description: String(err), title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const format = detectFormat(file.name);
    setDetectedFormat(format?.name ?? null);

    setImporting(true);
    setProgress(null);
    setResult(null);
    setError(null);
    try {
      const doc = await parseImportFile(file);
      const res = await importDocument(provider, doc, fields, (p) => setProgress(p));
      setResult(res);

      for (const slug of Object.keys(doc.collections)) {
        await queryClient.invalidateQueries({ queryKey: ["collection", slug] });
      }
      for (const slug of Object.keys(doc.globals)) {
        await queryClient.invalidateQueries({ queryKey: ["global", slug] });
      }
      await queryClient.invalidateQueries({ queryKey: ["media"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });

      addToast({
        description: `Imported ${res.imported} item(s), skipped ${res.skipped}.`,
        title: "Import complete",
      });
    } catch (err) {
      setError(String(err));
      addToast({ description: String(err), title: "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  const percent =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Export all content for backup or migrate it into another Blazing CMS project.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" /> Export
            </CardTitle>
            <CardDescription>
              Downloads a file containing every collection entry and global.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={exporting}>
                  <Download className="mr-1 h-4 w-4" />
                  {exporting ? "Exporting..." : "Export all content"}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => void handleExport("json")}>
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON (full fidelity)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport("csv")}>
                  CSV (flat fields only)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport("xml")}>
                  XML (full fidelity)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Import
            </CardTitle>
            <CardDescription>
              Restore from an exported file. Existing entries from the source are merged or skipped
              rather than overwritten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.xml,application/json,text/csv,application/xml"
              className="hidden"
              onChange={(e) => void handleImportFile(e)}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <FileJson className="mr-1 h-4 w-4" />
                {importing ? "Importing..." : "Choose file to import"}
              </Button>
              {detectedFormat && <Badge variant="secondary">{detectedFormat.toUpperCase()}</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      {importing && progress && (
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            <span>Importing...</span>
            <span>
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Import failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Import summary
              {detectedFormat && <Badge variant="outline">{detectedFormat.toUpperCase()}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Imported <span className="font-medium text-foreground">{result.imported}</span>{" "}
              item(s) and skipped{" "}
              <span className="font-medium text-foreground">{result.skipped}</span> (already exist
              or failed validation).
            </p>
            {result.errors.length > 0 && (
              <div className="max-h-60 overflow-auto rounded-md border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {result.errors.length} skipped item(s)
                </p>
                <ul className="space-y-1 text-xs">
                  {result.errors.slice(0, 50).map((err, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="shrink-0 font-mono text-muted-foreground">
                        {err.collection}/{err.id}
                      </span>
                      <span>{err.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
