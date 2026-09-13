import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ChangeEvent } from "react";

import type { DataProvider } from "@/lib/providers/types";

import { useToast } from "@/components/toast-provider";
import {
  buildExport,
  buildImportPreview,
  detectFormat,
  downloadDocument,
  filterDocument,
  importDocument,
  parseImportFile,
  type ExportFormat,
  type FieldSources,
  type ImportExportDocument,
  type ImportPreview,
  type ImportProgress,
  type ImportResult,
} from "@/lib/import-export";

function useExport(provider: DataProvider, fields: FieldSources) {
  const { addToast } = useToast();
  const [exporting, setExporting] = useState(false);

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

  async function handleExportItem(
    slug: string,
    type: "collection" | "global",
    format: ExportFormat = "json",
  ) {
    setExporting(true);
    try {
      const opts =
        type === "collection"
          ? { collections: [slug], globals: [] }
          : { collections: [], globals: [slug] };
      const doc = await buildExport(provider, fields, opts);
      const filename = `${type}-${slug}-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadDocument(doc, filename, format);
      addToast({ description: `Exported ${type} "${slug}".`, title: "Exported" });
    } catch (err) {
      addToast({ description: String(err), title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  return { exporting, handleExport, handleExportItem };
}

function useImport(provider: DataProvider, fields: FieldSources) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ImportExportDocument | null>(null);

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const doc = await parseImportFile(file);
      const formatName = detectFormat(file.name)?.name ?? "unknown";
      setParsedDoc(doc);
      setPreview(buildImportPreview(doc, formatName));
    } catch (err) {
      setError(String(err));
      addToast({ description: String(err), title: "Import failed", variant: "destructive" });
    }
  }

  function togglePreviewItem(type: "collection" | "global", slug: string, selected: boolean) {
    setPreview((prev) => {
      if (!prev) return prev;
      const key = type === "collection" ? "collections" : "globals";
      return {
        ...prev,
        [key]: prev[key].map((item) => (item.slug === slug ? { ...item, selected } : item)),
      };
    });
  }

  function setAllSelected(selected: boolean) {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        collections: prev.collections.map((c) => ({ ...c, selected })),
        globals: prev.globals.map((g) => ({ ...g, selected })),
      };
    });
  }

  function countSelectedItems(p: ImportPreview): number {
    const collectionCount = p.collections
      .filter((c) => c.selected)
      .reduce((s, c) => s + c.count, 0);
    const globalCount = p.globals.filter((g) => g.selected).length;
    return collectionCount + globalCount;
  }

  async function invalidateImportQueries(filtered: ImportExportDocument) {
    for (const slug of Object.keys(filtered.collections)) {
      await queryClient.invalidateQueries({ queryKey: ["collection", slug] });
    }
    for (const slug of Object.keys(filtered.globals)) {
      await queryClient.invalidateQueries({ queryKey: ["global", slug] });
    }
    await queryClient.invalidateQueries({ queryKey: ["media"] });
    await queryClient.invalidateQueries({ queryKey: ["analytics"] });
  }

  async function executeImport(filtered: ImportExportDocument) {
    const res = await importDocument(provider, filtered, fields, (p) => setProgress(p));
    setResult(res);
    await invalidateImportQueries(filtered);
    addToast({
      description: `Imported ${res.imported} item(s), skipped ${res.skipped}.`,
      title: "Import complete",
    });
    setPreview(null);
    setParsedDoc(null);
  }

  async function confirmImport() {
    if (!parsedDoc || !preview) return;

    if (countSelectedItems(preview) === 0) {
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
      await executeImport(filtered);
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

  return {
    cancelImport,
    confirmImport,
    error,
    fileInputRef,
    handleImportFile,
    importing,
    percent,
    preview,
    result,
    setAllSelected,
    togglePreviewItem,
  };
}

export function useImportExport(provider: DataProvider, fields: FieldSources) {
  const exp = useExport(provider, fields);
  const imp = useImport(provider, fields);

  return { ...exp, ...imp };
}
