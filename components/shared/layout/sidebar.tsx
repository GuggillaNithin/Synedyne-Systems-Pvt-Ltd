"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { NAV_ITEMS } from "@/constants";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col justify-between z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div>
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-lg overflow-hidden bg-primary flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="Synedyne" width={32} height={32} className="object-cover" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg bg-linear-to-r from-primary to-violet-500 bg-clip-text text-transparent truncate">
                Synedyne Pvt Ltd
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/75 cursor-pointer hidden md:block"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon size={18} className={cn("shrink-0", isActive ? "" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-sidebar-border space-y-2 bg-sidebar/50">
        {/* Light/Dark Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors"
          title="Toggle Theme"
        >
          <Sun size={18} className="dark:hidden shrink-0 text-muted-foreground" />
          <Moon size={18} className="hidden dark:block shrink-0 text-muted-foreground" />
          {!collapsed && <span className="truncate">Toggle Theme</span>}
        </button>

        {/* Team switcher stub */}
        {!collapsed && (
          <div className="p-2.5 bg-sidebar-accent rounded-lg flex items-center justify-between border border-sidebar-border">
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-sidebar-accent-foreground">Synedyne Systems</span>
              <span className="text-[10px] text-muted-foreground">Standard Instance</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
export default Sidebar;
