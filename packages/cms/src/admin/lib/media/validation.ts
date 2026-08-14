const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME =
  /^(image\/(?:jpeg|png|webp|gif|svg\+xml|avif)|video\/(?:mp4|webm)|application\/pdf)$/;

export function validateMediaFile(file: File, maxFileSize = DEFAULT_MAX_FILE_SIZE): void {
  if (file.size > maxFileSize) {
    throw new Error(`File exceeds the ${Math.round(maxFileSize / 1048576)}MB upload limit.`);
  }
  if (!ALLOWED_MIME.test(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }
}

export function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function pick<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

export async function measureImage(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith("image/")) return {};
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { height: bitmap.height, width: bitmap.width };
    bitmap.close();
    return dims;
  } catch {
    return {};
  }
}
