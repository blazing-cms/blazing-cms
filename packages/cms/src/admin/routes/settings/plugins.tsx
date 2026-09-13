import { createRoute } from "@tanstack/react-router";
import { Puzzle, ExternalLink, Search, Palette, Shield, Globe, Image } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { appLayoutRoute } from "@/routes/app-layout";

export const pluginsRoute = createRoute({
  component: PluginsSettings,
  getParentRoute: () => appLayoutRoute,
  path: "/settings/plugins",
});

interface PluginInfo {
  name: string;
  description: string;
  icon: typeof Puzzle;
  status: "built-in" | "available" | "coming-soon";
  docs?: string;
}

const KNOWN_PLUGINS: PluginInfo[] = [
  {
    description: "Meta tags, sitemaps, and Open Graph management.",
    icon: Globe,
    name: "SEO",
    status: "coming-soon",
  },
  {
    description: "Advanced field types and validators.",
    icon: Puzzle,
    name: "Custom Fields",
    status: "coming-soon",
  },
  {
    description: "Approval flows and content scheduling.",
    icon: Shield,
    name: "Workflows",
    status: "coming-soon",
  },
  {
    description: "Image compression, responsive images, and CDN integration.",
    icon: Image,
    name: "Media Optimizer",
    status: "coming-soon",
  },
  {
    description: "UI theme customization and white-labeling.",
    icon: Palette,
    name: "Themes",
    status: "coming-soon",
  },
];

function PluginsSettings() {
  const [search, setSearch] = useState("");
  const filtered = search
    ? KNOWN_PLUGINS.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : KNOWN_PLUGINS;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plugins</h1>
          <p className="mt-1 text-sm text-muted-foreground">Extend Blazing CMS with plugins.</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search plugins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Puzzle className="h-10 w-10 text-muted-foreground" />
            <CardTitle className="text-base">Plugin SDK</CardTitle>
            <CardDescription className="max-w-sm">
              Blazing CMS plugins are npm packages that register routes, extend the sidebar, and
              hook into content operations.
            </CardDescription>
            <Button variant="outline" size="sm" disabled>
              <ExternalLink className="mr-1 h-4 w-4" /> Documentation
            </Button>
          </CardContent>
        </Card>

        {filtered.map((plugin) => (
          <Card key={plugin.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <plugin.icon className="h-5 w-5 text-muted-foreground" />
                {plugin.name}
                <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] font-normal uppercase text-muted-foreground">
                  {plugin.status}
                </span>
              </CardTitle>
              <CardDescription>{plugin.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Search className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No plugins match &quot;{search}&quot;.</p>
        </div>
      )}
    </div>
  );
}
