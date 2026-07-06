import * as React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { GitBranch, Layers, Cpu, Database } from "lucide-react";
import { bomService } from "@/services/bom.service";


export const revalidate = 0; // Dynamic route

export default async function BOMPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const params = await searchParams;
  
  // Fetch products to populate sidebar
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const selectedProductId = params.productId || products[0]?.id;
  const selectedProduct = products.find((p: (typeof products)[number]) => p.id === selectedProductId);

  // Fetch BOM tree grouped by PCBA
  const bomTree = selectedProductId 
    ? await bomService.getBOMTree(selectedProductId)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Bill of Materials (BOM)</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Map structural assemblies (PCBA layers, subcomponents) and verify ingredients for each manufactured item.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Product Selector list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Layers size={16} /> Products Catalog
            </h3>
            <div className="space-y-1">
              {products.length === 0 ? (
                <div className="text-xs text-muted-foreground py-4 text-center">No products seeded.</div>
              ) : (
                products.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <Link
                      key={p.id}
                      href={`?productId=${p.id}`}
                      className={`block w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className="truncate">{p.name}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? "text-primary-foreground/75" : "text-muted-foreground/60"}`}>
                        {p.code} — {formatCurrency(p.sellingPrice)}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Detailed BOM Tree visualization */}
        <div className="lg:col-span-3 space-y-6">
          {selectedProduct ? (
            <div className="space-y-6">
              {/* Product Profile */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Currently Inspecting</span>
                  <h2 className="text-lg font-bold text-foreground">{selectedProduct.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedProduct.description || "Electronics product assembly."}</p>
                </div>
                <div className="text-left sm:text-right space-y-1 shrink-0">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Standard Price</span>
                  <div className="text-lg font-bold text-primary">{formatCurrency(selectedProduct.sellingPrice)}</div>
                  <span className="text-[10px] text-muted-foreground block">{selectedProduct.code}</span>
                </div>
              </div>

              {/* BOM Tree by PCBA Group */}
              <div className="space-y-4">
                {bomTree.length === 0 ? (
                  <div className="bg-card border border-dashed rounded-xl p-12 text-center text-xs text-muted-foreground">
                    No components mapped to this product in the Bill of Materials.
                  </div>
                ) : (
                  bomTree.map((group) => (
                    <div key={group.pcba} className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                      <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground flex items-center gap-2">
                          <GitBranch className="h-4.5 w-4.5 text-primary" />
                          {group.pcba}
                        </span>
                        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                          {group.totalComponents} items
                        </span>
                      </div>
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-semibold">
                          <tr>
                            <th className="px-5 py-3">Component Code</th>
                            <th className="px-5 py-3">Component Name</th>
                            <th className="px-5 py-3">Category</th>
                            <th className="px-5 py-3 text-right">Qty Per Product (QPS)</th>
                            <th className="px-5 py-3">Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {group.items.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-foreground">{item.component.code}</td>
                              <td className="px-5 py-3.5 text-muted-foreground">{item.component.name}</td>
                              <td className="px-5 py-3.5">
                                <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground border border-border">
                                  {item.component.category}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                                {formatNumber(Number(item.qtyPerProduct))}
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground uppercase">{item.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-dashed rounded-xl p-12 text-center text-xs text-muted-foreground">
              Please seed historical data or add a product to explore Bill of Materials.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
