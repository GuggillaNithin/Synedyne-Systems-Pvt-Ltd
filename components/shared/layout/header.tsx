"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Search, Calendar, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { UserButton, useUser } from "@clerk/nextjs";

interface HeaderProps {
  onRefresh?: () => void;
}

export function Header({ onRefresh }: HeaderProps) {
  const { user } = useUser();
  const [dateStr, setDateStr] = React.useState("");

  React.useEffect(() => {
    setDateStr(format(new Date(), "EEEE, do MMMM yyyy"));
  }, []);

  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "ERP User";

  const department =
    typeof user?.publicMetadata?.department === "string"
      ? user.publicMetadata.department
      : "ERP User";

  return (
    <header className="h-16 border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
      {/* Search Bar / CMD+K Tip */}
      <div className="flex items-center gap-4 w-96 max-w-[50%]">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search... (Press ⌘K)"
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:bg-card transition-all"
            readOnly
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
              document.dispatchEvent(event);
            }}
          />
        </div>
      </div>

      {/* Toolbar / Actions & User Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          <Calendar size={14} />
          <span>{dateStr || "Loading..."}</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors border border-border bg-card"
            title="Refresh Data"
          >
            <RefreshCw size={14} />
          </button>
        )}

        <button
          className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors border border-border bg-card"
          onClick={() => (window.location.href = "/notifications")}
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-card" />
        </button>

        <div className="h-6 w-[1px] bg-border" />

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-semibold text-foreground">{displayName}</span>
              <span className="text-[10px] text-muted-foreground">{department}</span>
            </div>
            <UserButton
              appearance={{
                variables: {
                  colorPrimary: "#7c3aed",
                },
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg border border-border bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
export default Header;
