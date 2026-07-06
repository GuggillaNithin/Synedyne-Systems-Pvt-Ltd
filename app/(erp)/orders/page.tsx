import * as React from "react";
import Link from "next/link";
import { Plus, Search, Eye, Check, X, AlertTriangle } from "lucide-react";
import { orderService } from "@/services/order.service";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderCreationDialog } from "./order-creation-dialog";

export const revalidate = 0; // Dynamic route

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page || "1");
  const search = params.search || "";
  const status = params.status || "";

  // Fetch list
  const { data: orders, totalPages } = await orderService.listOrders({
    page,
    pageSize: 15,
    search,
    status: status || undefined,
  });

  // Fetch unique customers and products for selector in dialog
  const customers = await prisma.customer.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  const serializedCustomers = customers.map((customer: any) => ({
    id: customer.id,
    name: customer.name,
    code: customer.code,
  }));

  const serializedProducts = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    code: product.code,
    sellingPrice: Number(product.sellingPrice),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Process invoices, monitor lead times, track material availability, and trigger production pipelines.
          </p>
        </div>
        <OrderCreationDialog customers={serializedCustomers} products={serializedProducts} />
      </div>

      {/* Filter and Search Bar */}
      <form action="/orders" method="get" className="bg-card border border-border p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-96 flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search order number or customer..."
            className="w-full bg-muted/40 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:bg-card transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <input type="hidden" name="page" value="1" />
          <select
            name="status"
            defaultValue={status}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="INVOICED">Invoiced</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Orders List Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Order Number</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Order Date</th>
                <th className="px-6 py-3.5">Delivery Date</th>
                <th className="px-6 py-3.5">Total Value</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No sales orders found. Seeding the database first is highly recommended.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{order.customer.name}</div>
                      <div className="text-[10px] text-muted-foreground">{order.customer.code}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(order.orderDate)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(order.deliveryDate)}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        order.status === "APPROVED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        order.status === "PENDING" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                        order.status === "IN_PRODUCTION" ? "bg-primary/10 border-primary/20 text-primary" :
                        order.status === "DISPATCHED" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                        order.status === "INVOICED" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600" :
                        "bg-red-500/10 border-red-500/20 text-red-500"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 bg-muted hover:bg-muted-foreground/15 border border-border px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors"
                      >
                        <Eye size={12} />
                        View Workspace
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground bg-muted/10">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Link
                href={`?page=${Math.max(1, page - 1)}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}
                className={`px-3 py-1 bg-card border border-border rounded-md hover:bg-muted ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                Previous
              </Link>
              <Link
                href={`?page=${Math.min(totalPages, page + 1)}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}
                className={`px-3 py-1 bg-card border border-border rounded-md hover:bg-muted ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
