import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Copy, FileText, Film, Replace, Save, Trash2 } from "lucide-react";
import { useRef, useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { useToast } from "@/components/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmDelete } from "@/lib/hooks/use-confirm-delete";
import { formatBytes, isImage, type MediaFolder, type MediaRecord } from "@/lib/media/types";
import { resetFileInput } from "@/lib/media/upload";
import { findMediaUsage, type MediaReference } from "@/lib/media/usage";
import { useDataProvider } from "@/lib/providers/context";
import { logDenied, usePermissions } from "@/lib/rbac";
import { appLayoutRoute } from "@/routes/app-layout";

export const mediaDetailRoute = createRoute({
  component: MediaDetail,
  getParentRoute: () => appLayoutRoute,
  path: "/media/$id",
});

function PreviewImage({ media }: { media: MediaRecord }) {
  if (isImage(media)) {
    return (
      <img
        src={media.url}
        alt={media.altText ?? media.name}
        className="mx-auto max-h-96 max-w-full rounded-lg border object-contain"
      />
    );
  }
  const Icon = media.contentType?.startsWith("video/") ? Film : FileText;
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border bg-muted">
      <Icon className="h-16 w-16 text-muted-foreground" />
    </div>
  );
}

function MetaLine({ media }: { media: MediaRecord }) {
  return (
    <p className="text-sm text-muted-foreground">
      {formatBytes(media.size)}
      {media.width ? ` · ${media.width}×${media.height}` : ""} · {media.contentType}
    </p>
  );
}

function ReplaceButton({
  onReplace,
  progress,
  replacing,
}: {
  onReplace: () => void;
  progress: number;
  replacing: boolean;
}) {
  return (
    <Button variant="outline" onClick={onReplace} disabled={replacing}>
      <Replace className="mr-1 h-4 w-4" />
      {replacing ? `Replacing… ${Math.round(progress)}%` : "Replace File"}
    </Button>
  );
}

function UsageSection({ usage }: { usage?: MediaReference[] }) {
  if (!usage || usage.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">
        Used in {usage.length} place{usage.length === 1 ? "" : "s"}
      </h2>
      <ul className="space-y-1">
        {usage.map((ref) => (
          <li
            key={`${ref.collection}-${ref.entryId}`}
            className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm"
          >
            <span className="font-medium">{ref.title}</span>
            <Badge variant="secondary">
              {ref.collection} / {ref.entryId}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FormProps {
  altText: string;
  caption: string;
  folder: string;
  folders?: MediaFolder[];
  onAltTextChange: (value: string) => void;
  onCaptionChange: (value: string) => void;
  onFolderChange: (value: string) => void;
  onSave: (event: FormEvent) => void;
  onTagsChange: (value: string) => void;
  tags: string;
}

function MediaForm(props: FormProps) {
  return (
    <form onSubmit={props.onSave} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="altText">Alt Text</Label>
        <Input
          id="altText"
          value={props.altText}
          onChange={(e) => props.onAltTextChange(e.target.value)}
          placeholder="Describe the image for accessibility"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="caption">Caption</Label>
        <Input
          id="caption"
          value={props.caption}
          onChange={(e) => props.onCaptionChange(e.target.value)}
          placeholder="Optional caption"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="folder">Folder</Label>
        <Select
          id="folder"
          value={props.folder}
          onChange={(e) => props.onFolderChange(e.target.value)}
        >
          <option value="">No folder</option>
          {props.folders?.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={props.tags}
          onChange={(e) => props.onTagsChange(e.target.value)}
          placeholder="hero, brand, launch"
        />
      </div>
    </form>
  );
}

function text(value: string | null | undefined): string {
  return value ?? "";
}

function joinTags(tags: string[] | undefined): string {
  return (tags ?? []).join(", ");
}

function toFormState(media: MediaRecord): {
  altText: string;
  caption: string;
  folder: string;
  tags: string;
} {
  return {
    altText: text(media.altText),
    caption: text(media.caption),
    folder: text(media.folder),
    tags: joinTags(media.tags),
  };
}

function MediaDetail() {
  const { id } = mediaDetailRoute.useParams();
  const router = useRouter();
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { canSystem } = usePermissions();
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const confirmDelete = useConfirmDelete();
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [folder, setFolder] = useState("");
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [progress, setProgress] = useState(0);

  const canManage = canSystem("manageMedia");

  function deny(action: string) {
    void logDenied(provider, {
      action,
      reason: "missing manageMedia permission",
      resource: "media",
    });
  }

  const { data: media, isLoading } = useQuery({
    queryFn: async () => provider.findOne("media", id) as Promise<MediaRecord | null>,
    queryKey: ["media", id],
  });

  const { data: folders } = useQuery({
    queryFn: async () => {
      const result = await provider.findMany("media_folders", { limit: 200 });
      return result.data as unknown as MediaFolder[];
    },
    queryKey: ["media_folders"],
  });

  const { data: usage } = useQuery({
    enabled: !!media,
    queryFn: () => {
      if (!media) return Promise.resolve([]);
      return findMediaUsage(provider, media.url);
    },
    queryKey: ["media-usage", id],
  });

  useEffect(() => {
    if (!media) return;
    const form = toFormState(media);
    setAltText(form.altText);
    setCaption(form.caption);
    setTags(form.tags);
    setFolder(form.folder);
  }, [media]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!canManage) {
      deny("update");
      return;
    }
    setSaving(true);
    try {
      await provider.update("media", id, {
        altText,
        caption,
        folder: folder || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      addToast({ description: "Media details updated.", title: "Saved" });
      await queryClient.invalidateQueries({ queryKey: ["media"] });
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleReplace(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!canManage) {
      deny("replace");
      resetFileInput(replaceInputRef);
      return;
    }
    setReplacing(true);
    setProgress(0);
    try {
      await provider.replaceMedia(id, file, { onProgress: setProgress });
      addToast({ description: "File has been replaced.", title: "Replaced" });
      await queryClient.invalidateQueries({ queryKey: ["media", id] });
      await queryClient.invalidateQueries({ queryKey: ["media"] });
    } catch (err) {
      addToast({ description: String(err), title: "Replace failed", variant: "destructive" });
    } finally {
      setReplacing(false);
      resetFileInput(replaceInputRef);
    }
  }

  async function handleDelete() {
    if (!canManage) {
      deny("delete");
      return;
    }
    const deleted = await confirmDelete({
      description: "Media item deleted.",
      id,
      message: "Delete this media item? This cannot be undone.",
      onDelete: (itemId) => provider.deleteMedia(itemId),
      queryKey: "media",
      toastTitle: "Deleted",
    });
    if (deleted) router.navigate({ to: "/media" });
  }

  async function handleCopyUrl() {
    if (!media) return;
    try {
      await navigator.clipboard.writeText(media.url);
      addToast({ description: "URL copied to clipboard.", title: "Copied" });
    } catch {
      addToast({ description: "Could not copy URL.", title: "Error", variant: "destructive" });
    }
  }

  if (isLoading || !media) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.history.back()}
            className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold">{media.name}</h1>
          <MetaLine media={media} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyUrl}>
            <Copy className="mr-1 h-4 w-4" /> Copy URL
          </Button>
          {canManage && (
            <>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <PreviewImage media={media} />

          {canManage && (
            <div>
              <input
                ref={replaceInputRef}
                type="file"
                className="hidden"
                onChange={handleReplace}
              />
              <ReplaceButton
                onReplace={() => replaceInputRef.current?.click()}
                progress={progress}
                replacing={replacing}
              />
            </div>
          )}

          <UsageSection usage={usage} />
        </div>

        <div className="space-y-4">
          <MediaForm
            altText={altText}
            caption={caption}
            folder={folder}
            folders={folders}
            onAltTextChange={setAltText}
            onCaptionChange={setCaption}
            onFolderChange={setFolder}
            onSave={handleSave}
            onTagsChange={setTags}
            tags={tags}
          />
          <p className="text-xs text-muted-foreground">
            URL: <span className="break-all">{media.url}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
