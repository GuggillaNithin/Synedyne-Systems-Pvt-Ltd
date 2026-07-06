"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";

export function MarkAllReadButton() {
  const [loading, setLoading] = React.useState(false);

  const handleMark = async () => {
    setLoading(true);
    try {
      const res = await markAllNotificationsReadAction();
      if (res.success) {
        toast.success("All notifications marked as read");
      } else {
        toast.error("Failed to mark all as read");
      }
    } catch (e: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      className="inline-flex items-center gap-1.5 border border-border hover:bg-muted text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-75"
    >
      <Check size={14} />
      Mark all as read
    </button>
  );
}
export default MarkAllReadButton;
