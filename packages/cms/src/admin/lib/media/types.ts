export interface MediaFolder {
  id: string;
  name: string;
  createdAt?: string;
}

export interface MediaRecord {
  id: string;
  altText?: string;
  caption?: string;
  contentType?: string;
  createdAt?: string;
  folder?: string | null;
  height?: number | null;
  name: string;
  path?: string;
  size?: number;
  tags?: string[];
  updatedAt?: string;
  url: string;
  width?: number | null;
}

export function isImage(record: MediaRecord): boolean {
  return record.contentType?.startsWith("image/") ?? false;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function folderCount(items: MediaRecord[], id: string): number {
  return items.filter((item) => item.folder === id).length;
}

export function folderName(folders: MediaFolder[] | undefined, id?: string | null): string {
  return folders?.find((folder) => folder.id === id)?.name ?? id ?? "No folder";
}
