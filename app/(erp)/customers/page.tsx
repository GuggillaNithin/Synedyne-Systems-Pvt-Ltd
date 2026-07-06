import * as React from "react";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
import { Users, BarChart3, TrendingUp } from "lucide-react";

export const revalidate = 0; // Dynamic route

export default async function CustomersDemandPage() {
  // Fetch customers with their aggregate counts
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { salesOrders: true, customerDemand: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Fetch customer demand logs
  const demands = await prisma.customerDemand.findMany({
    take: 50,
    include: {
      customer: true,
      product: true,
    },
    orderBy: [{ month: "asc" }, { week: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers & Demand Forecasts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Evaluate historical customer demand forecasts against confirmed order counts and actual shipments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Customers list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Users size={16} /> Partner Accounts
            </h3>
            <div className="divide-y divide-border">
              {customers.length === 0 ? (
                <div className="text-xs text-muted-foreground py-4 text-center">No customers seeded.</div>
              ) : (
                customers.map((c: (typeof customers)[number]) => (
                  <div key={c.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{c._count.salesOrders} orders</div>
                      <div className="text-[10px] text-muted-foreground">{c._count.customerDemand} demand lines</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Detailed demand forecasting table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TrendingUp size={16} /> Weekly Forecast Analysis
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-semibold sticky top-0 bg-card z-10">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Horizon</th>
                    <th className="px-5 py-3 text-right">Forecast</th>
                    <th className="px-5 py-3 text-right">Confirmed</th>
                    <th className="px-5 py-3 text-right">Dispatched</th>
                    <th className="px-5 py-3 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {demands.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No weekly forecasts found. Please seed using Excel workbook first.
                      </td>
                    </tr>
                  ) : (
                    demands.map((d: (typeof demands)[number]) => (
                      <tr key={d.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-foreground">{d.customer.name}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold">{d.product.name}</div>
                          <div className="text-[9px] text-muted-foreground">{d.product.code}</div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {d.month} — {d.week}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold">{formatNumber(d.forecastQty)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-primary">{formatNumber(d.confirmedOrderQty)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-emerald-500">{formatNumber(d.actualDispatchQty)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-amber-500">{formatNumber(d.pendingQty)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
