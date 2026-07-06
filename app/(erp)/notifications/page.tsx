import * as React from "react";
import { notificationService } from "@/services/notification.service";
import { formatDate } from "@/lib/utils";
import { Bell, ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { MarkAllReadButton } from "./mark-all-read-button";

export const revalidate = 0; // Dynamic route

export default async function NotificationsPage() {
  const { data: notifications } = await notificationService.getAll({
    page: 1,
    pageSize: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications & Alerts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit automated workflow events, low stock levels, and transaction results.
          </p>
        </div>
        <MarkAllReadButton />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No notifications logs available. System events are recorded automatically during order processing.
            </div>
          ) : (
            notifications.map((n: any) => {
              const isShortage = n.type === "LOW_STOCK" || n.type === "MATERIAL_SHORTAGE";
              const isSuccess = n.type === "ORDER_APPROVED" || n.type === "PRODUCTION_COMPLETED" || n.type === "DISPATCH_COMPLETED";
              return (
                <div key={n.id} className={`p-4 flex gap-3.5 text-xs transition-colors hover:bg-muted/10 ${!n.isRead ? "bg-primary/5 font-semibold" : ""}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    isShortage ? "bg-red-500/10 text-red-500" :
                    isSuccess ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-primary/10 text-primary"
                  }`}>
                    {isShortage ? <AlertTriangle size={14} /> :
                     isSuccess ? <ShieldCheck size={14} /> :
                     <Bell size={14} />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-foreground">{n.title}</div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{n.message}</p>
                    <div className="text-[9px] text-muted-foreground pt-1">{formatDate(n.createdAt)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
