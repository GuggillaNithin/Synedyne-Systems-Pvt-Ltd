import * as React from "react";
import { Package2, WarehouseIcon, Calendar, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/utils";

export const revalidate = 0;

export default async function FinishedGoodsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const page = Number(params.page ?? 1);
  const pageSize = 20;

  const where = query
    ? {
        product: {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { code: { contains: query, mode: "insensitive" as const } },
          ],
        },
      }
    : {};

  const [finishedGoods, total] = await Promise.all([
    prisma.finishedGood.findMany({
      where,
      include: {
        product: true,
        productionOrder: { select: { id: true, status: true } },
      },
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.finishedGood.count({ where }),
  ]);

  // Aggregate totals
  const totalQty = finishedGoods.reduce((sum: number, fg: any) => sum + fg.quantity, 0);
  const uniqueProducts = new Set(finishedGoods.map((fg: any) => fg.productId)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finished Goods</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Completed production stock ready for dispatch
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card border border-border px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <Package2 size={14} className="text-primary" />
            <span className="text-muted-foreground">Total Stock:</span>
            <span className="font-bold">{formatNumber(totalQty)} units</span>
          </div>
          <div className="bg-card border border-border px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <WarehouseIcon size={14} className="text-violet-500" />
            <span className="text-muted-foreground">SKUs:</span>
            <span className="font-bold">{uniqueProducts}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search finished goods by product name or code..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </form>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
            <tr>
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Quantity</th>
              <th className="px-5 py-3">Warehouse Location</th>
              <th className="px-5 py-3">Production Order</th>
              <th className="px-5 py-3">Received At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {finishedGoods.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  <Package2 size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No finished goods records. Import data to populate.</p>
                </td>
              </tr>
            ) : (
              finishedGoods.map((fg, idx) => (
                <tr key={fg.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-muted-foreground text-xs">
                    {String((page - 1) * pageSize + idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-foreground">{fg.product.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{fg.product.code}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatNumber(fg.quantity)} units
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md text-xs font-medium">
                      <WarehouseIcon size={11} />
                      {fg.warehouseLocation ?? "Finished Goods Store"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {fg.productionOrder ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        fg.productionOrder.status === "COMPLETED"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                      }`}>
                        {fg.productionOrder.status}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      {formatDate(fg.receivedAt)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {Math.min(page * pageSize, total)} of {total} records
        </p>
      )}
    </div>
  );
}
