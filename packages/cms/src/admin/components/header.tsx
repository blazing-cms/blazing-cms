import { LogOut } from "lucide-react";

import { projectName } from "@/__generated__/app-config";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 border-b px-6">
      <span className="text-sm font-semibold tracking-tight">{projectName}</span>
      <div className="flex-1" />
      <NotificationBell />
      <ModeToggle />
      <Button variant="ghost" size="icon" title="Sign out" onClick={logout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
