import { createRoute, Link } from "@tanstack/react-router";
import { Database, Puzzle } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { appLayoutRoute } from "@/routes/app-layout";

export const settingsIndexRoute = createRoute({
  component: SettingsList,
  getParentRoute: () => appLayoutRoute,
  path: "/settings",
});

const settingsItems = [
  { href: "/settings/plugins", icon: Puzzle, label: "Plugins" },
  { href: "/settings/content", icon: Database, label: "Content Tools" },
];

function SettingsList() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
