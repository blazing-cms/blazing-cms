import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { useDataProvider } from "@/lib/providers/context";
import { logDenied } from "@/lib/rbac";

interface DeniedNoticeProps {
  action: string;
  resource: string;
}

export function DeniedNotice({ action, resource }: DeniedNoticeProps) {
  const provider = useDataProvider();
  const { user } = useAuth();

  useEffect(() => {
    void logDenied(provider, {
      action,
      reason: "missing permission",
      resource,
      userId: user?.uid,
    });
  }, [action, provider, resource, user?.uid]);

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h2 className="text-xl font-semibold">No access</h2>
      <p className="text-muted-foreground">You do not have permission to perform this action.</p>
    </div>
  );
}
