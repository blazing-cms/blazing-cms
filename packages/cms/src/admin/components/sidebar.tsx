import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Globe,
  Image,
  Users,
  Shield,
  FileJson,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import {
  collections as registryCollections,
  globals as registryGlobals,
} from "@/__generated__/schema-registry";
import { isDevMode } from "@/lib/backend-mode";
import { featureEnabled } from "@/lib/features";
import { usePermissions } from "@/lib/rbac";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function navSections(
  can: (action: string, resource: string) => boolean,
  canSystem: (action: string) => boolean,
): NavSection[] {
  const contentEnabled = featureEnabled("content");
  const mediaEnabled = featureEnabled("media");
  const analyticsEnabled = featureEnabled("analytics");
  const rbacEnabled = featureEnabled("rbac");
  const readableCollections = contentEnabled
    ? registryCollections.filter((c) => can("read", c.slug))
    : [];

  const collections = readableCollections.map((c) => ({
    group: (c as { admin?: { group?: string } }).admin?.group ?? "Collections",
    href: `/collections/${c.slug}`,
    icon: FileText,
    label: (c as { labels?: { plural?: string; singular?: string } }).labels?.plural ?? c.slug,
  }));

  const globals = contentEnabled
    ? registryGlobals.map((g) => ({
        group: g.admin?.group ?? "Globals",
        href: `/globals/${g.slug}`,
        icon: Globe,
        label: g.label ?? g.slug,
      }))
    : [];

  const contentItems: (NavItem & { group?: string })[] = [];
  if (readableCollections.length > 0) {
    contentItems.push({
      group: "Collections",
      href: "/collections",
      icon: FileText,
      label: "All Collections",
    });
  }
  contentItems.push(...collections);
  if (contentEnabled) {
    contentItems.push({ group: "Globals", href: "/globals", icon: Globe, label: "All Globals" });
  }
  contentItems.push(...globals);
  if (mediaEnabled) {
    contentItems.push({ group: "Media", href: "/media", icon: Image, label: "Media" });
  }

  const groups = new Map<string, (NavItem & { group?: string })[]>();
  const ungrouped: (NavItem & { group?: string })[] = [];

  for (const item of contentItems) {
    if (item.group) {
      const g = groups.get(item.group) ?? [];
      g.push(item);
      groups.set(item.group, g);
    } else {
      ungrouped.push(item);
    }
  }

  const dynamicSections: NavSection[] = [];
  for (const [groupLabel, items] of groups) {
    dynamicSections.push({ items, label: groupLabel });
  }
  if (ungrouped.length > 0) {
    dynamicSections.push({ items: ungrouped, label: "Content" });
  }

  return [
    {
      items: [
        { href: "/", icon: LayoutDashboard, label: "Dashboard" },
        ...(analyticsEnabled ? [{ href: "/analytics", icon: BarChart3, label: "Analytics" }] : []),
      ],
      label: "Overview",
    },
    ...dynamicSections,
    {
      items: [
        ...(rbacEnabled && canSystem("manageUsers")
          ? [{ href: "/users", icon: Users, label: "Users" }]
          : []),
        ...(rbacEnabled && canSystem("manageRoles")
          ? [{ href: "/roles", icon: Shield, label: "Roles" }]
          : []),
        ...(isDevMode() ? [{ href: "/schemas", icon: FileJson, label: "Schemas" }] : []),
        { href: "/settings", icon: Settings, label: "Settings" },
      ],
      label: "System",
    },
  ];
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { can, canSystem } = usePermissions();
  const sections = navSections(can, canSystem);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar-background text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 border-b border-sidebar-border px-6 py-3",
          collapsed && "justify-center",
        )}
      >
        <Flame className="h-5 w-5 shrink-0 text-orange-500" />
        {!collapsed && <span className="text-base font-bold tracking-tight">Blazing CMS</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-md p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "" : "ml-auto",
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {sections.map((section) => (
          <div key={section.label} className="mb-4 last:mb-0">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}
            <div className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2",
                    "[&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
