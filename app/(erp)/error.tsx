"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ERPError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[ERP Page Error]:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 animate-fade-in">
      <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-5 ring-4 ring-destructive/5">
        <AlertTriangle size={32} className="text-destructive" />
      </div>
      <h1 className="text-xl font-bold mb-2">Page Error</h1>
      <p className="text-sm text-muted-foreground mb-2 max-w-md">
        This ERP module encountered an unexpected error. This may be a database connection issue
        or a data consistency problem.
      </p>
      {error.message && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2.5 mb-5 max-w-md">
          <code className="text-xs text-destructive font-mono">{error.message}</code>
        </div>
      )}
      {error.digest && (
        <p className="text-[10px] text-muted-foreground mb-4">Error ID: {error.digest}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Home size={14} />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
