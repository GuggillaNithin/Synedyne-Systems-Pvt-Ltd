import * as React from "react";
import { FileText, DollarSign, Clock, CheckCircle2, Search, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS_CONFIG } from "@/constants";

export const revalidate = 0;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const statusFilter = params.status ?? "";
  const page = Number(params.page ?? 1);
  const pageSize = 20;

  const where: any = {};
  if (query) {
    where.OR = [
      { invoiceNumber: { contains: query, mode: "insensitive" } },
      { customer: { name: { contains: query, mode: "insensitive" } } },
    ];
  }
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { name: true, code: true } },
        salesOrder: { select: { orderNumber: true } },
      },
      orderBy: { invoiceDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ]);

  // Summary metrics
  const [paidTotal, pendingTotal, overdueCount] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { paidAmount: true }, where: { status: "PAID" } }),
    prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ["SENT", "DRAFT"] } } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track billing documents and payment collection
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg">
          <FileText size={14} className="text-primary" />
          <span className="font-semibold text-foreground">{total}</span> total invoices
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Paid</p>
            <p className="text-lg font-bold">{formatCurrency(Number(paidTotal._sum.paidAmount ?? 0))}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Outstanding</p>
            <p className="text-lg font-bold">{formatCurrency(Number(pendingTotal._sum.totalAmount ?? 0))}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Overdue Invoices</p>
            <p className="text-lg font-bold text-red-500">{overdueCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form method="GET" className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search invoice number or customer..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </form>
        <div className="flex items-center gap-2">
          {["", "DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].map((s: any) => (
            <a
              key={s || "all"}
              href={`/invoices?status=${s}&q=${query}`}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-muted/50"
              }`}
            >
              {s || "All"}
            </a>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
            <tr>
              <th className="px-5 py-3">Invoice #</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Sales Order</th>
              <th className="px-5 py-3">Invoice Date</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Paid</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                  <FileText size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No invoices found. Import data to get started.</p>
                </td>
              </tr>
            ) : (
              invoices.map((invoice: any) => {
                const statusConf = INVOICE_STATUS_CONFIG[invoice.status as keyof typeof INVOICE_STATUS_CONFIG];
                const balanceDue = Number(invoice.totalAmount) - Number(invoice.paidAmount);
                return (
                  <tr key={invoice.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{invoice.customer.name}</div>
                      <div className="text-[10px] text-muted-foreground">{invoice.customer.code}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">
                      {invoice.salesOrder?.orderNumber ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      {formatCurrency(Number(invoice.totalAmount))}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(Number(invoice.paidAmount))}
                        </span>
                        {balanceDue > 0 && (
                          <span className="text-muted-foreground"> / {formatCurrency(balanceDue)} due</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConf?.color ?? ""}`}>
                        {statusConf?.label ?? invoice.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
