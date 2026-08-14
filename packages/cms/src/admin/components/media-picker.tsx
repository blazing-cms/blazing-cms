import { useQuery } from "@tanstack/react-query";
import { Check, ImagePlus } from "lucide-react";
import { useState } from "react";

import { MediaThumb } from "@/components/media-thumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { type MediaRecord } from "@/lib/media/types";
import { useDataProvider } from "@/lib/providers/context";
import { cn } from "@/lib/utils";

export interface MediaPickerProps {
  value: string;
  onChange: (value: string) => void;
}

function MediaPickerGrid({
  items,
  onSelect,
  value,
}: {
  items: MediaRecord[];
  onSelect: (item: MediaRecord) => void;
  value: string;
}) {
  return (
    <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            "relative aspect-square overflow-hidden rounded-md border",
            value === item.url && "border-primary ring-2 ring-primary",
          )}
        >
          <MediaThumb media={item} />
          {value === item.url && (
            <span className="absolute right-1 top-1 rounded-full bg-primary p-1 text-white">
              <Check className="h-3 w-3" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function MediaPicker({ onChange, value }: MediaPickerProps) {
  const provider = useDataProvider();
  const [open, setOpen] = useState(false);
  const { data: items, isLoading } = useQuery({
    enabled: open,
    queryFn: async () => {
      const result = await provider.findMany("media", { limit: 100 });
      return result.data as unknown as MediaRecord[];
    },
    queryKey: ["media-picker"],
  });

  function handleSelect(item: MediaRecord) {
    onChange(item.url);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <ImagePlus className="mr-1 h-4 w-4" /> Choose media
      </Button>
      {value && <p className="truncate text-xs text-muted-foreground">Selected: {value}</p>}
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select media</DialogTitle>
            <DialogDescription>Pick an item from the media library.</DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : (
            <MediaPickerGrid items={items ?? []} onSelect={handleSelect} value={value} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
