import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";

import type { NotificationRecord } from "@/lib/providers/types";

import { useToast } from "@/components/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useDataProvider } from "@/lib/providers/context";
import { formatVersionDate } from "@/lib/versions";

function unreadCount(notifications: NotificationRecord[] | undefined): number {
  return notifications?.filter((n) => !n.read).length ?? 0;
}

function notificationTitle(n: NotificationRecord): string {
  return n.message || "Notification";
}

export function NotificationBell() {
  const { user } = useAuth();
  const provider = useDataProvider();
  const router = useRouter();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const uid = user?.uid ?? null;

  const { data: notifications } = useQuery({
    enabled: uid !== null,
    queryFn: () => provider.listNotifications(uid as string),
    queryKey: ["notifications", uid],
    refetchInterval: 30_000,
  });

  async function openItem(n: NotificationRecord) {
    if (!n.read) {
      try {
        await provider.markNotificationsRead([n.id]);
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch (err) {
        addToast({ description: String(err), title: "Error", variant: "destructive" });
      }
    }
    setOpen(false);
    if (n.collection && n.entryId) {
      router.navigate({
        params: { id: n.entryId, slug: n.collection },
        to: "/collections/$slug/$id" as string,
      });
    }
  }

  const count = unreadCount(notifications);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" title="Notifications" onClick={() => setOpen((o) => !o)}>
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <Badge variant="secondary">{count} unread</Badge>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => void openItem(n)}
                    className={`w-full px-3 py-2 text-left hover:bg-muted ${n.read ? "opacity-60" : ""}`}
                  >
                    <p className="text-sm font-medium">{notificationTitle(n)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatVersionDate(n.createdAt)}
                    </p>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                No notifications yet.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
