import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Link, createRoute } from "@tanstack/react-router";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Grid3X3,
  Image as ImageIcon,
  List,
  Search,
  Upload,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";

import type { DataProvider } from "@/lib/providers/types";

import { MediaThumb } from "@/components/media-thumb";
import { useToast } from "@/components/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { filterMedia } from "@/lib/media/filter";
import {
  folderCount,
  folderName,
  formatBytes,
  type MediaFolder,
  type MediaRecord,
} from "@/lib/media/types";
import {
  resetFileInput,
  toastUploadResults,
  uploadSequence,
  type AddToast,
} from "@/lib/media/upload";
import { useDataProvider } from "@/lib/providers/context";
import { logDenied, usePermissions } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { appLayoutRoute } from "@/routes/app-layout";

export const mediaRoute = createRoute({
  component: MediaLibrary,
  getParentRoute: () => appLayoutRoute,
  path: "/media",
});

function MediaCard({ folders, item }: { folders?: MediaFolder[]; item: MediaRecord }) {
  return (
    <Link
      to="/media/$id"
      params={{ id: item.id }}
      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-colors hover:border-primary"
    >
      <MediaThumb media={item} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-white">{item.name}</p>
        <p className="text-[10px] text-white/70">
          {formatBytes(item.size)}
          {item.width ? ` · ${item.width}×${item.height}` : ""}
        </p>
      </div>
      {item.folder && (
        <Badge className="absolute left-2 top-2 bg-black/50 text-white">
          {folderName(folders, item.folder)}
        </Badge>
      )}
    </Link>
  );
}

function MediaGrid({ folders, items }: { folders?: MediaFolder[]; items: MediaRecord[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <MediaCard key={item.id} folders={folders} item={item} />
      ))}
    </div>
  );
}

function MediaListRow({ folders, item }: { folders?: MediaFolder[]; item: MediaRecord }) {
  return (
    <Link
      to="/media/$id"
      params={{ id: item.id }}
      className="flex items-center gap-3 px-3 py-2 hover:bg-muted"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
        <MediaThumb media={item} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.altText ?? item.contentType ?? "No alt text"}
        </p>
      </div>
      {item.folder && <Badge variant="secondary">{folderName(folders, item.folder)}</Badge>}
      <span className="hidden text-xs text-muted-foreground sm:block">
        {formatBytes(item.size)}
      </span>
    </Link>
  );
}

function MediaList({ folders, items }: { folders?: MediaFolder[]; items: MediaRecord[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((item) => (
        <li key={item.id}>
          <MediaListRow folders={folders} item={item} />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <ImageIcon className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">
        {search ? "No matches found" : "No media in this folder"}
      </h2>
      <p className="text-muted-foreground">
        {search ? "Try a different search term." : "Upload your first file to get started."}
      </p>
    </div>
  );
}

function MediaBrowser({
  folders,
  isLoading,
  items,
  search,
  view,
}: {
  folders?: MediaFolder[];
  isLoading: boolean;
  items: MediaRecord[];
  search: string;
  view: "grid" | "list";
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }
  if (items.length === 0) return <EmptyState search={search} />;
  if (view === "grid") return <MediaGrid folders={folders} items={items} />;
  return <MediaList folders={folders} items={items} />;
}

function ViewToggle({
  onChange,
  view,
}: {
  onChange: (view: "grid" | "list") => void;
  view: "grid" | "list";
}) {
  return (
    <div className="flex rounded-md border">
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "rounded-l-md p-2 transition-colors",
          view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
        )}
        aria-label="Grid view"
      >
        <Grid3X3 className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        className={cn(
          "rounded-r-md p-2 transition-colors",
          view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

function FolderSidebar({
  activeFolder,
  folders,
  items,
  onSelect,
}: {
  activeFolder: string | null;
  folders?: MediaFolder[];
  items: MediaRecord[];
  onSelect: (folder: string | null) => void;
}) {
  return (
    <aside className="space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          activeFolder === null
            ? "bg-primary/10 font-medium text-primary"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <ImageIcon className="h-4 w-4" /> All Media
        <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
      </button>
      {folders?.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onSelect(folder.id)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            activeFolder === folder.id
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {activeFolder === folder.id ? (
            <FolderOpen className="h-4 w-4" />
          ) : (
            <Folder className="h-4 w-4" />
          )}
          {folder.name}
          <span className="ml-auto text-xs text-muted-foreground">
            {folderCount(items, folder.id)}
          </span>
        </button>
      ))}
    </aside>
  );
}

function FolderDialog({
  creating,
  name,
  onClose,
  onCreate,
  onNameChange,
  open,
}: {
  creating: boolean;
  name: string;
  onClose: () => void;
  onCreate: (event: FormEvent) => void;
  onNameChange: (value: string) => void;
  open: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>Group related media into a folder.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onCreate} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? "Creating…" : "Create Folder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

async function fetchMedia(provider: DataProvider): Promise<MediaRecord[]> {
  const result = await provider.findMany("media", { limit: 200 });
  return result.data as unknown as MediaRecord[];
}

async function fetchFolders(provider: DataProvider): Promise<MediaFolder[]> {
  const result = await provider.findMany("media_folders", { limit: 200 });
  return result.data as unknown as MediaFolder[];
}

async function createFolder(
  provider: DataProvider,
  name: string,
  queryClient: QueryClient,
  addToast: AddToast,
): Promise<boolean> {
  try {
    await provider.create("media_folders", { name });
    addToast({ description: `Folder "${name}" created.`, title: "Created" });
    await queryClient.invalidateQueries({ queryKey: ["media_folders"] });
    return true;
  } catch (err) {
    addToast({ description: String(err), title: "Error", variant: "destructive" });
    return false;
  }
}

function DropOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/80">
      <p className="text-lg font-medium">Drop files to upload</p>
    </div>
  );
}

function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
    </div>
  );
}

function MediaToolbar({
  canManage,
  fileInputRef,
  onNewFolder,
  onUpload,
  progress,
  uploading,
}: {
  canManage: boolean;
  fileInputRef: { current: HTMLInputElement | null };
  onNewFolder: () => void;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  progress: number;
  uploading: boolean;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-3xl font-bold">Media Library</h1>
      <div className="flex items-center gap-2">
        {canManage && (
          <>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Drag &amp; drop to upload
            </span>
            <Button variant="outline" onClick={onNewFolder}>
              <FolderPlus className="mr-1 h-4 w-4" /> New Folder
            </Button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onUpload} />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-1 h-4 w-4" />
              {uploading ? `Uploading… ${Math.round(progress)}%` : "Upload"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function MediaLibrary() {
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { canSystem } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const { data: mediaItems, isLoading } = useQuery({
    queryFn: () => fetchMedia(provider),
    queryKey: ["media"],
  });

  const { data: folders } = useQuery({
    queryFn: () => fetchFolders(provider),
    queryKey: ["media_folders"],
  });

  const items = mediaItems ?? [];
  const visible = filterMedia(items, activeFolder, search);
  const canManage = canSystem("manageMedia");

  async function runUpload(files: File[]) {
    if (files.length === 0) return;
    if (!canManage) {
      void logDenied(provider, {
        action: "upload",
        reason: "missing manageMedia permission",
        resource: "media",
      });
      return;
    }
    setUploading(true);
    setProgress(0);
    const results = await uploadSequence(provider, files, activeFolder, setProgress);
    toastUploadResults(results, addToast);
    setUploading(false);
    await queryClient.invalidateQueries({ queryKey: ["media"] });
    resetFileInput(fileInputRef);
  }

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    void runUpload(Array.from(e.target.files ?? []));
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave() {
    setDragActive(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragActive(false);
    void runUpload(Array.from(e.dataTransfer.files));
  }

  async function handleCreateFolder(e: FormEvent) {
    e.preventDefault();
    if (!canManage) {
      void logDenied(provider, {
        action: "create",
        reason: "missing manageMedia permission",
        resource: "media_folders",
      });
      return;
    }
    const name = folderName.trim();
    if (!name) return;
    setCreatingFolder(true);
    const created = await createFolder(provider, name, queryClient, addToast);
    if (created) {
      setFolderName("");
      setFolderDialogOpen(false);
    }
    setCreatingFolder(false);
  }

  return (
    <div
      className="relative"
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {dragActive && <DropOverlay />}

      <MediaToolbar
        canManage={canSystem("manageMedia")}
        fileInputRef={fileInputRef}
        onNewFolder={() => setFolderDialogOpen(true)}
        onUpload={handleUpload}
        progress={progress}
        uploading={uploading}
      />

      {uploading && <UploadProgress progress={progress} />}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <FolderSidebar
          activeFolder={activeFolder}
          folders={folders}
          items={items}
          onSelect={setActiveFolder}
        />

        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, alt text, or tag…"
                className="pl-9"
              />
            </div>
            <ViewToggle onChange={setView} view={view} />
          </div>

          <MediaBrowser
            folders={folders}
            isLoading={isLoading}
            items={visible}
            search={search}
            view={view}
          />
        </div>
      </div>

      <FolderDialog
        creating={creatingFolder}
        name={folderName}
        onClose={() => setFolderDialogOpen(false)}
        onCreate={handleCreateFolder}
        onNameChange={setFolderName}
        open={folderDialogOpen}
      />
    </div>
  );
}
