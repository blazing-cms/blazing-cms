import { useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { Download, Upload, FileJson, ChevronDown, Globe, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { collections, components, globals } from "@/__generated__/schema-registry";
import { useToast } from "@/components/toast-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildExport,
  buildFieldSources,
  buildImportPreview,
  detectFormat,
  downloadDocument,
  filterDocument,
  importDocument,
  parseImportFile,
  type ExportFormat,
  type ImportExportDocument,
  type ImportPreview,
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
  const globalSlugs = Object.keys(fields.globals);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ImportExportDocument | null>(null);

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

  async function handleExportGlobal(slug: string, format: ExportFormat = "json") {
    setExporting(true);
    try {
      const doc = await buildExport(provider, fields, { collections: [], globals: [slug] });
      const filename = `global-${slug}-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadDocument(doc, filename, format);
      addToast({ description: `Exported global "${slug}".`, title: "Exported" });
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

    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const doc = await parseImportFile(file);
      const format = detectFormat(file.name);
      const preview = buildImportPreview(doc, format?.name ?? "unknown");
      setParsedDoc(doc);
      setPreview(preview);
    } catch (err) {
      setError(String(err));
      addToast({ description: String(err), title: "Import failed", variant: "destructive" });
    }
  }

  function toggleCollection(slug: string, selected: boolean) {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        collections: prev.collections.map((c) => (c.slug === slug ? { ...c, selected } : c)),
      };
    });
  }

  function toggleGlobal(slug: string, selected: boolean) {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        globals: prev.globals.map((g) => (g.slug === slug ? { ...g, selected } : g)),
      };
    });
  }

  function selectAll() {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        collections: prev.collections.map((c) => ({ ...c, selected: true })),
        globals: prev.globals.map((g) => ({ ...g, selected: true })),
      };
    });
  }

  function deselectAll() {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        collections: prev.collections.map((c) => ({ ...c, selected: false })),
        globals: prev.globals.map((g) => ({ ...g, selected: false })),
      };
    });
  }

  async function confirmImport() {
    if (!parsedDoc || !preview) return;

    const selectedCount =
      preview.collections.filter((c) => c.selected).reduce((s, c) => s + c.count, 0) +
      preview.globals.filter((g) => g.selected).length;

    if (selectedCount === 0) {
      addToast({
        description: "No items selected.",
        title: "Import cancelled",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(null);
    setResult(null);
    setError(null);

    try {
      const filtered = filterDocument(parsedDoc, preview);
      const res = await importDocument(provider, filtered, fields, (p) => setProgress(p));
      setResult(res);

      for (const slug of Object.keys(filtered.collections)) {
        await queryClient.invalidateQueries({ queryKey: ["collection", slug] });
      }
      for (const slug of Object.keys(filtered.globals)) {
        await queryClient.invalidateQueries({ queryKey: ["global", slug] });
      }
      await queryClient.invalidateQueries({ queryKey: ["media"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });

      addToast({
        description: `Imported ${res.imported} item(s), skipped ${res.skipped}.`,
        title: "Import complete",
      });

      setPreview(null);
      setParsedDoc(null);
    } catch (err) {
      setError(String(err));
      addToast({ description: String(err), title: "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  function cancelImport() {
    setPreview(null);
    setParsedDoc(null);
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
              Restore from an exported file. Select which items to import.
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
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || !!preview}
            >
              <FileJson className="mr-1 h-4 w-4" />
              {importing ? "Importing..." : "Choose file to import"}
            </Button>
          </CardContent>
        </Card>

        {globalSlugs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Export Globals
              </CardTitle>
              <CardDescription>Export individual global settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={exporting}>
                    <Globe className="mr-1 h-4 w-4" />
                    Choose global
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {globalSlugs.map((slug) => (
                    <DropdownMenuItem key={slug} onClick={() => void handleExportGlobal(slug)}>
                      {slug}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        )}
      </div>

      {preview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Import Preview
              <Badge variant="secondary">{preview.format.toUpperCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.collections.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Collections</p>
                {preview.collections.map((col) => (
                  <label key={col.slug} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={col.selected}
                      onChange={(e) => toggleCollection(col.slug, e.target.checked)}
                    />
                    <span className="text-sm">{col.slug}</span>
                    <span className="text-xs text-muted-foreground">
                      ({col.count} {col.count === 1 ? "entry" : "entries"})
                    </span>
                  </label>
                ))}
              </div>
            )}

            {preview.globals.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Globals</p>
                {preview.globals.map((g) => (
                  <label key={g.slug} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={g.selected}
                      onChange={(e) => toggleGlobal(g.slug, e.target.checked)}
                    />
                    <span className="text-sm">{g.slug}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-medium text-foreground">{preview.totalEntries}</span>{" "}
                {preview.totalEntries === 1 ? "entry" : "entries"} to import
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelImport}>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={() => void confirmImport()} disabled={importing}>
                Import Selected
              </Button>
            </div>

            <div className="flex gap-2 text-xs">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Deselect all
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle>Import summary</CardTitle>
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
