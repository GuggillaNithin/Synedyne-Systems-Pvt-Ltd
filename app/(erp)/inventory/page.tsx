import * as React from "react";
import { Search, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { inventoryService } from "@/services/inventory.service";
import { formatNumber } from "@/lib/utils";
import { AdjustInventoryForm } from "./adjust-inventory-form";

export const revalidate = 0; // Dynamic route

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page || "1");
  const search = params.search || "";

  // Fetch inventory
  const { data: inventoryItems, totalPages } = await inventoryService.getInventoryWithAvailability({
    page,
    pageSize: 20,
    search,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Synedyne Warehouse Inventory</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track component availability, reserve stocks, adjust levels, and handle reorder warnings.
        </p>
      </div>

      {/* Search Header */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
        <form className="relative w-full sm:w-96 flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search component code or name..."
            className="w-full bg-muted/40 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:bg-card transition-all"
          />
        </form>
      </div>

      {/* Inventory Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Component Code</th>
                <th className="px-5 py-3.5">Component Name</th>
                <th className="px-5 py-3.5">Warehouse Location</th>
                <th className="px-5 py-3.5 text-right">Opening Stock</th>
                <th className="px-5 py-3.5 text-right">Current Stock</th>
                <th className="px-5 py-3.5 text-right">Reserved Stock</th>
                <th className="px-5 py-3.5 text-right">Available Stock</th>
                <th className="px-5 py-3.5 text-right">Reorder Threshold</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Manual Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventoryItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-muted-foreground">
                    No inventory records found. Make sure to upload the Excel workbook first.
                  </td>
                </tr>
              ) : (
                inventoryItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4 font-bold text-foreground">{item.component.code}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground truncate max-w-[200px]" title={item.component.name}>
                        {item.component.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{item.component.category}</div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{item.warehouse}</td>
                    <td className="px-5 py-4 text-right text-muted-foreground">{formatNumber(item.openingStock)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-foreground">{formatNumber(item.currentStock)}</td>
                    <td className="px-5 py-4 text-right font-medium text-amber-500">{formatNumber(item.reservedStock)}</td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-500">{formatNumber(item.availableStock)}</td>
                    <td className="px-5 py-4 text-right text-muted-foreground">{formatNumber(item.reorderPoint)}</td>
                    <td className="px-5 py-4">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={10} /> Adequate
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <AdjustInventoryForm inventoryId={item.id} />
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
