import * as React from "react";
import { dispatchService } from "@/services/dispatch.service";
import { formatNumber, formatDate } from "@/lib/utils";
import { Truck, Navigation, CheckCircle2 } from "lucide-react";

export const revalidate = 0; // Dynamic route

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const status = params.status || "";

  // Fetch dispatches
  const { data: dispatches } = await dispatchService.getDispatches({
    search,
    status: status || undefined,
  });

  const pendingCount = await dispatchService.getPendingDispatchCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Shipment Logistics</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Dispatch good finished items, assign carrier waybill numbers, and monitor customer shipping state.
        </p>
      </div>

      {/* Logistics KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Pending Dispatches</span>
            <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
          </div>
          <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center">
            <Navigation size={20} />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Carrier Status</span>
            <div className="text-2xl font-bold text-emerald-500">Active</div>
          </div>
          <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/10">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Truck size={16} /> Customer Shipping Manifests
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Shipping Date</th>
                <th className="px-5 py-3.5">Sales Order Ref</th>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Carrier Waybill (Tracking)</th>
                <th className="px-5 py-3.5 text-right">Planned Dispatch</th>
                <th className="px-5 py-3.5 text-right">Actual Shipped</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No shipping manifests found. Create and dispatch a Sales Order to register.
                  </td>
                </tr>
              ) : (
                dispatches.map((disp: any) => (
                  <tr key={disp.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">{formatDate(disp.dispatchDate)}</td>
                    <td className="px-5 py-4 text-primary font-bold">{disp.salesOrder.orderNumber}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground">{disp.customer.name}</div>
                      <div className="text-[10px] text-muted-foreground">{disp.customer.code}</div>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">{disp.trackingNumber || "PENDING"}</td>
                    <td className="px-5 py-4 text-right font-semibold">{formatNumber(disp.plannedQty)}</td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-500">{formatNumber(disp.actualQty)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        disp.status === "DELIVERED" || disp.status === "DISPATCHED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        disp.status === "PENDING" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                        "bg-orange-500/10 border-orange-500/20 text-orange-500"
                      }`}>
                        {disp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
