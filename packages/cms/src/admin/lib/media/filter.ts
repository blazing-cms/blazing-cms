import type { MediaRecord } from "./types";

export function filterMedia(
  items: MediaRecord[],
  folder: string | null,
  search: string,
): MediaRecord[] {
  const term = search.trim().toLowerCase();
  return items.filter((item) => {
    if (folder && item.folder !== folder) return false;
    if (term) return matchesSearch(item, term);
    return true;
  });
}

function searchable(item: MediaRecord): string[] {
  return [item.name, item.altText ?? "", item.caption ?? "", ...(item.tags ?? [])];
}

function matchesSearch(item: MediaRecord, term: string): boolean {
  return searchable(item).some((value) => value.toLowerCase().includes(term));
}
