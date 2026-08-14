import type { DataProvider } from "@/lib/providers/types";

import { overallProgress } from "./progress";

export interface UploadResult {
  error?: string;
  name: string;
  ok: boolean;
}

export type AddToast = (toast: {
  description?: string;
  title: string;
  variant?: "default" | "destructive" | "success";
}) => void;

export async function uploadSequence(
  provider: DataProvider,
  files: File[],
  folder: string | null,
  onProgress: (percent: number) => void,
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  let done = 0;
  for (const file of files) {
    try {
      await provider.uploadMedia(file, {
        folder,
        onProgress: (percent) => onProgress(overallProgress(done, files.length, percent)),
      });
      results.push({ name: file.name, ok: true });
    } catch (err) {
      results.push({ error: String(err), name: file.name, ok: false });
    }
    done += 1;
  }
  return results;
}

export function toastUploadResults(results: UploadResult[], addToast: AddToast): void {
  for (const result of results) {
    if (result.ok) {
      addToast({ description: `${result.name} uploaded.`, title: "Uploaded" });
    } else {
      addToast({
        description: `${result.name}: ${result.error}`,
        title: "Upload failed",
        variant: "destructive",
      });
    }
  }
}

export function resetFileInput(ref: { current: HTMLInputElement | null }): void {
  if (ref.current) ref.current.value = "";
}
