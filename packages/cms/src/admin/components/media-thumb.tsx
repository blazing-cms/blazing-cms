import { FileText, Film } from "lucide-react";

import { isImage, type MediaRecord } from "@/lib/media/types";

export function MediaThumb({ media }: { media: MediaRecord }) {
  if (isImage(media)) {
    return (
      <img
        src={media.url}
        alt={media.altText ?? media.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }
  const Icon = media.contentType?.startsWith("video/") ? Film : FileText;
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <Icon className="h-10 w-10 text-muted-foreground" />
    </div>
  );
}
