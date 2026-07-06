"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NAV_ITEMS } from "@/constants";

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!query) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-[15vh]">
      <div 
        className="relative w-full max-w-xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-border bg-muted/30">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            type="text"
            className="w-full bg-transparent outline-hidden text-foreground placeholder-muted-foreground text-sm"
            placeholder="Search modules (e.g. Sales, Inventory, EMS)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button 
            onClick={() => setOpen(false)}
            className="text-xs bg-muted px-2 py-1 rounded-sm text-muted-foreground border border-border"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="text-sm text-center py-6 text-muted-foreground">
              No modules found.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Modules & Views
              </div>
              {filteredItems.map((item) => (
                <button
                  key={item.href}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center"
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
                >
                  <item.icon className="h-4 w-4 mr-3 text-muted-foreground" />
                  {item.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Background click listener to close */}
      <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
    </div>
  );
}
export default CommandMenu;
