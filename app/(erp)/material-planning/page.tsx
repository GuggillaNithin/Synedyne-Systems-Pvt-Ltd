import * as React from "react";
import { materialPlanningService } from "@/services/material-planning.service";
import { formatNumber, formatDate } from "@/lib/utils";
import { BarChart3, AlertCircle, ShoppingCart } from "lucide-react";

export const revalidate = 0; // Dynamic route

export default async function MaterialPlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";

  // Fetch planning logs
  const { data: plans } = await materialPlanningService.getAllMaterialPlans({
    search,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Material Requirements Planning (MRP)</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Process gross requirements, allocate stock reserves, calculate net shortages, and generate automated purchase recommendations.
        </p>
      </div>

      {/* MRP Plans list */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/10">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" /> Active Material Requirement Matrix
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Component</th>
                <th className="px-5 py-3.5">Linked Order</th>
                <th className="px-5 py-3.5 text-right">Gross Qty Req</th>
                <th className="px-5 py-3.5 text-right">Stock (Available)</th>
                <th className="px-5 py-3.5 text-right">Stock (EMS)</th>
                <th className="px-5 py-3.5 text-right">Net Shortage</th>
                <th className="px-5 py-3.5 text-right">Lead Time</th>
                <th className="px-5 py-3.5">Shortage Target Week</th>
                <th className="px-5 py-3.5">Purchase Order Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    No material plans generated. Try creating a Sales Order or importing the seed workbook.
                  </td>
                </tr>
              ) : (
                plans.map((plan: any) => {
                  const linkedPR = plan.purchaseRequests?.[0];
                  return (
                    <tr key={plan.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-foreground">{plan.component.code}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={plan.component.name}>
                          {plan.component.name}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-primary font-medium">
                        {plan.salesOrder?.orderNumber}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">{formatNumber(plan.grossRequirement)}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground">{formatNumber(plan.availableStock)}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground">{formatNumber(plan.stockAtEMS)}</td>
                      <td className="px-5 py-4 text-right">
                        {plan.shortageQty > 0 ? (
                          <span className="text-red-500 font-bold">{formatNumber(plan.shortageQty)}</span>
                        ) : (
                          <span className="text-emerald-500 font-semibold">0</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right text-muted-foreground">{plan.leadTimeWeeks} weeks</td>
                      <td className="px-5 py-4">
                        {plan.shortageWeek ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full font-semibold">
                            <AlertCircle size={10} /> {plan.shortageWeek}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {linkedPR ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-foreground flex items-center gap-1">
                              <ShoppingCart size={10} className="text-primary" />
                              {linkedPR.poNumber || "PR-PENDING"}
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                              Status: <b className="text-foreground">{linkedPR.status}</b> | Expected: {linkedPR.expectedDelivery ? formatDate(linkedPR.expectedDelivery) : "ASAP"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
