import type { DataProvider } from "@/lib/providers/types";

export interface AuditEntry {
  action: string;
  reason: string;
  resource: string;
  userId?: string;
}

export async function logDenied(provider: DataProvider, entry: AuditEntry): Promise<void> {
  try {
    await provider.create("access_logs", {
      action: entry.action,
      createdAt: new Date().toISOString(),
      reason: entry.reason,
      resource: entry.resource,
      result: "denied",
      userId: entry.userId ?? null,
    });
  } catch {
    // Logging must never break the calling flow.
  }
}
