/* eslint-disable max-lines -- Content Tools page with export/import/preview UI */
import { createRoute } from "@tanstack/react-router";
import { Download, Upload, FileJson, ChevronDown, Globe, X, type LucideIcon } from "lucide-react";

import { collections, components, globals } from "@/__generated__/schema-registry";
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
import { buildFieldSources, type ImportPreview } from "@/lib/import-export";
import { useDataProvider } from "@/lib/providers/context";
import { useImportExport } from "@/lib/use-import-export";
import { appLayoutRoute } from "@/routes/app-layout";

export const contentToolsRoute = createRoute({
  component: ContentTools,
  getParentRoute: () => appLayoutRoute,
  path: "/settings/content",
});

interface ExportDropdownProps {
  disabled: boolean;
  items: Array<{ label: string; onClick: () => void }>;
  icon: typeof Globe;
  label: string;
}

function ExportDropdown({ disabled, icon: Icon, items, label }: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Icon className="mr-1 h-4 w-4" />
          {label}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item) => (
          <DropdownMenuItem key={item.label} onClick={item.onClick}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ImportPreviewCardProps {
  preview: ImportPreview;
  importing: boolean;
  onToggleCollection: (slug: string, selected: boolean) => void;
  onToggleGlobal: (slug: string, selected: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function ImportPreviewCard({
  importing,
  onCancel,
  onConfirm,
  onDeselectAll,
  onSelectAll,
  onToggleCollection,
  onToggleGlobal,
  preview,
}: ImportPreviewCardProps) {
  return (
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
                  onChange={(e) => onToggleCollection(col.slug, e.target.checked)}
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
                  onChange={(e) => onToggleGlobal(g.slug, e.target.checked)}
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
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={importing}>
            Import Selected
          </Button>
        </div>

        <div className="flex gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onSelectAll}>
            Select all
          </Button>
          <Button variant="ghost" size="sm" onClick={onDeselectAll}>
            Deselect all
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportResultCard({
  result,
}: {
  result: {
    imported: number;
    skipped: number;
    errors: Array<{ collection: string; id: string; message: string }>;
  };
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Import summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Imported <span className="font-medium text-foreground">{result.imported}</span> item(s)
          and skipped <span className="font-medium text-foreground">{result.skipped}</span> (already
          exist or failed validation).
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
  );
}

function ExportCard({
  description,
  disabled,
  icon: Icon,
  items,
  title,
}: {
  title: string;
  icon: LucideIcon;
  description: string;
  disabled: boolean;
  items: Array<{ label: string; onClick: () => void }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ExportDropdown disabled={disabled} items={items} icon={Icon} label={title} />
      </CardContent>
    </Card>
  );
}

function ImportCard({
  fileInputRef,
  handleImportFile,
  importing,
  preview,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  importing: boolean;
  preview: unknown;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
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
  );
}

function ImportProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex justify-between text-sm text-muted-foreground">
        <span>Importing...</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ContentTools() {
  const provider = useDataProvider();
  const fields = buildFieldSources({ collections, components, globals });
  const collectionSlugs = Object.keys(fields.collections);
  const globalSlugs = Object.keys(fields.globals);

  const {
    cancelImport,
    confirmImport,
    error,
    exporting,
    fileInputRef,
    handleExport,
    handleExportItem,
    handleImportFile,
    importing,
    percent,
    preview,
    result,
    setAllSelected,
    togglePreviewItem,
  } = useImportExport(provider, fields);

  const exportAllItems = [
    { label: "JSON (full fidelity)", onClick: () => void handleExport("json") },
    { label: "CSV (flat fields only)", onClick: () => void handleExport("csv") },
    { label: "XML (full fidelity)", onClick: () => void handleExport("xml") },
  ];

  const globalItems = globalSlugs.map((slug) => ({
    label: slug,
    onClick: () => void handleExportItem(slug, "global"),
  }));

  const collectionItems = collectionSlugs.map((slug) => ({
    label: slug,
    onClick: () => void handleExportItem(slug, "collection"),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Export all content for backup or migrate it into another Blazing CMS project.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExportCard
          title="Export"
          icon={Download}
          description="Downloads a file containing every collection entry and global."
          disabled={exporting}
          items={exportAllItems}
        />
        <ImportCard
          fileInputRef={fileInputRef}
          importing={importing}
          preview={preview}
          handleImportFile={handleImportFile}
        />
        {globalSlugs.length > 0 && (
          <ExportCard
            title="Export Globals"
            icon={Globe}
            description="Export individual global settings."
            disabled={exporting}
            items={globalItems}
          />
        )}
        {collectionSlugs.length > 0 && (
          <ExportCard
            title="Export Collections"
            icon={FileJson}
            description="Export individual collection entries."
            disabled={exporting}
            items={collectionItems}
          />
        )}
      </div>

      {preview && (
        <ImportPreviewCard
          preview={preview}
          importing={importing}
          onToggleCollection={(slug, selected) => togglePreviewItem("collection", slug, selected)}
          onToggleGlobal={(slug, selected) => togglePreviewItem("global", slug, selected)}
          onSelectAll={() => setAllSelected(true)}
          onDeselectAll={() => setAllSelected(false)}
          onConfirm={() => void confirmImport()}
          onCancel={cancelImport}
        />
      )}

      {importing && percent > 0 && <ImportProgressBar percent={percent} />}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Import failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && <ImportResultCard result={result} />}
    </div>
  );
}
