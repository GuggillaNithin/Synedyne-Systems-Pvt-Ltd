import * as React from "react";
import Link from "next/link";
import { Package, Search, ChevronRight, Tag, Layers } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const revalidate = 0;

export default async function ProductsPage({
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
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { code: { contains: query, mode: "insensitive" as const } },
          { category: { contains: query, mode: "insensitive" as const } },
        ],
        deletedAt: null,
      }
    : { deletedAt: null };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        _count: { select: { bomItems: true, salesOrderItems: true } },
      },
      orderBy: { code: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Category color map
  const categoryColors: Record<string, string> = {
    "PCB Assembly": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    "Electronic Module": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "IoT Device": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    "Power Unit": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "Control System": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products & BOM</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage finished goods catalogue and bill of materials
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg">
          <Package size={14} className="text-primary" />
          <span className="font-semibold text-foreground">{total}</span> total products
        </div>
      </div>

      {/* Search Bar */}
      <form method="GET" className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by product name, code, or category..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </form>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
            <tr>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Product Name</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Unit Price</th>
              <th className="px-5 py-3">BOM Items</th>
              <th className="px-5 py-3">Orders</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                  <Package size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No products found. Import data to get started.</p>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const categoryColor = categoryColors[product.category ?? ""] ?? "bg-slate-500/10 text-slate-600 dark:text-slate-400";
                return (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary">
                      {product.code}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{product.name}</td>
                    <td className="px-5 py-3.5">
                      {product.category ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor}`}>
                          <Tag size={10} />
                          {product.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      {formatCurrency(Number(product.sellingPrice))}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Layers size={12} />
                        {product._count.bomItems} components
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      {product._count.salesOrderItems} line items
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        product.isActive
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-500/10 border-slate-500/20 text-slate-500"
                      }`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="w-24 px-5 py-3.5 text-right">
                      <Link
                        href={`/bom?productId=${product.id}`}
                        className="inline-flex items-center justify-end gap-0.5 text-[10px] text-primary font-semibold opacity-0 invisible transition-opacity duration-200 group-hover:visible group-hover:opacity-100"
                      >
                        View BOM <ChevronRight size={10} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/products?q=${query}&page=${p}`}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted/50"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
