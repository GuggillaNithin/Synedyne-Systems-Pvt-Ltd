import * as React from "react";
import { emsService } from "@/services/ems.service";
import { formatNumber, formatDate } from "@/lib/utils";
import { Truck } from "lucide-react";

export const revalidate = 0; // Dynamic route

export default async function EMSDispatchPage() {
  const { data: dispatches } = await emsService.getDispatchPlan({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">EMS to Synedyne Shipping Plans</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track transit status, check quantities received by Synedyne warehouses, and view backlog logs from the EMS contractor.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/10">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Truck size={16} className="text-primary" /> Contractor Shipment Logs
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Shipping Date</th>
                <th className="px-5 py-3.5">PCBA description</th>
                <th className="px-5 py-3.5 text-right">Planned Dispatch</th>
                <th className="px-5 py-3.5 text-right">Actual Dispatched</th>
                <th className="px-5 py-3.5 text-right">Received by Synedyne</th>
                <th className="px-5 py-3.5 text-right">Backlog / Pending Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No contractor shipping logs found. Please upload the Excel seed file.
                  </td>
                </tr>
              ) : (
                dispatches.map((disp: any) => (
                  <tr key={disp.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">{formatDate(disp.emsDispatchDate)}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">{disp.pcba}</td>
                    <td className="px-5 py-4 text-right font-semibold">{formatNumber(disp.plannedDispatch)}</td>
                    <td className="px-5 py-4 text-right text-muted-foreground">{formatNumber(disp.actualDispatch)}</td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-500">{formatNumber(disp.receivedBySynedyne)}</td>
                    <td className="px-5 py-4 text-right text-red-500 font-semibold">{formatNumber(disp.pendingQty)}</td>
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
