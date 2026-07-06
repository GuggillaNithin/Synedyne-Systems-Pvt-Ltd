import * as React from "react";
import { productionService } from "@/services/production.service";
import { formatNumber, formatDate } from "@/lib/utils";
import { Factory, Play, CheckCircle2 } from "lucide-react";
import { ProductionActionButtons } from "./production-action-buttons";

export const revalidate = 0; // Dynamic route

export default async function ProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const status = params.status || "";

  // Fetch production orders
  const { data: productionOrders } = await productionService.getAllProductionOrders({
    search,
    status: status || undefined,
  });

  // Calculate overall efficiency metrics
  const stats = await productionService.getEfficiencyStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Production Operations</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Execute planned orders, log manufactured quantities, analyze rejection rates, and move completed finished goods into warehousing.
        </p>
      </div>

      {/* Production Efficiency KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl text-center shadow-xs">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Production Efficiency</span>
          <span className="text-xl font-bold text-primary mt-1 block">{stats.efficiency}%</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center shadow-xs">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Planned Quantity</span>
          <span className="text-xl font-bold text-foreground mt-1 block">{formatNumber(stats.planned)}</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center shadow-xs">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Good Finished Quantity</span>
          <span className="text-xl font-bold text-emerald-500 mt-1 block">{formatNumber(stats.finished)}</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center shadow-xs">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Rejected Scrap Quantity</span>
          <span className="text-xl font-bold text-red-500 mt-1 block">{formatNumber(stats.rejected)}</span>
        </div>
      </div>

      {/* Production Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/10">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Factory size={16} /> Manufacturing Production Queue
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Sales Order Ref</th>
                <th className="px-5 py-3.5 text-right">Planned Qty</th>
                <th className="px-5 py-3.5 text-right">Actual Qty</th>
                <th className="px-5 py-3.5 text-right">Scrap Qty</th>
                <th className="px-5 py-3.5 text-right">Finished Qty</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Planned Date</th>
                <th className="px-5 py-3.5 text-right">Process Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productionOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    No production orders queued. Create a Sales Order or seed using Excel workbook.
                  </td>
                </tr>
              ) : (
                productionOrders.map((po: any) => (
                  <tr key={po.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-foreground">{po.product.name}</div>
                      <div className="text-[10px] text-muted-foreground">{po.product.code}</div>
                    </td>
                    <td className="px-5 py-4 text-primary font-medium">
                      {po.salesOrder?.orderNumber || "Stock Build"}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">{formatNumber(po.plannedQty)}</td>
                    <td className="px-5 py-4 text-right text-muted-foreground">{formatNumber(po.actualQty)}</td>
                    <td className="px-5 py-4 text-right text-red-500">{formatNumber(po.rejectedQty)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-500">{formatNumber(po.finishedQty)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        po.status === "COMPLETED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        po.status === "PENDING" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                        po.status === "IN_PROGRESS" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                        "bg-red-500/10 border-red-500/20 text-red-500"
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(po.plannedDate)}</td>
                    <td className="px-5 py-4 text-right">
                      <ProductionActionButtons productionId={po.id} status={po.status} plannedQty={po.plannedQty} />
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
