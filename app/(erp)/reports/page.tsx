import * as React from "react";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { FileBarChart, Download, FileText } from "lucide-react";
import { ExportCSVButton } from "./export-csv-button";

export const revalidate = 0; // Dynamic route

export default async function ReportsPage() {
  // Fetch summaries for report tabs
  const inventory = await prisma.inventory.findMany({
    include: { component: true },
    orderBy: { component: { code: "asc" } }
  });

  const revenue = await prisma.revenue.findMany({
    include: { customer: true, product: true },
    orderBy: { month: "asc" }
  });

  const production = await prisma.productionOrder.findMany({
    include: { product: true },
    orderBy: { plannedDate: "desc" }
  });

  const dispatches = await prisma.dispatch.findMany({
    include: { customer: true, salesOrder: true },
    orderBy: { dispatchDate: "desc" }
  });

  const mrp = await prisma.materialPlan.findMany({
    include: { component: true, salesOrder: true },
    orderBy: { shortageQty: "desc" }
  });

  // Prepare CSV payloads for client-side download
  const inventoryCSVData = inventory.map(item => ({
    "Component Code": item.component.code,
    "Component Name": item.component.name,
    "Warehouse": item.warehouse,
    "Opening Stock": item.openingStock,
    "Current Stock": item.currentStock,
    "Reserved Stock": item.reservedStock,
    "Stock at EMS": item.stockAtEMS,
    "Reorder Point": item.reorderPoint,
    "Remarks": item.remarks || "OK"
  }));

  const revenueCSVData = revenue.map(item => ({
    "Month": item.month,
    "Customer": item.customer.name,
    "Product": item.product.name,
    "Units Sold": item.unitsSold,
    "Price": item.sellingPrice,
    "Revenue": item.revenue,
    "Payment Status": item.paymentStatus
  }));

  const productionCSVData = production.map(item => ({
    "Product Code": item.product.code,
    "Product Name": item.product.name,
    "Planned Qty": item.plannedQty,
    "Actual Qty": item.actualQty,
    "Rejected Qty": item.rejectedQty,
    "Finished Qty": item.finishedQty,
    "Status": item.status,
    "Planned Date": item.plannedDate ? formatDate(item.plannedDate) : "—"
  }));

  const dispatchCSVData = dispatches.map(item => ({
    "Dispatch Date": item.dispatchDate ? formatDate(item.dispatchDate) : "—",
    "Sales Order": item.salesOrder.orderNumber,
    "Customer": item.customer.name,
    "Planned Qty": item.plannedQty,
    "Actual Qty": item.actualQty,
    "Tracking": item.trackingNumber || "—",
    "Status": item.status
  }));

  const mrpCSVData = mrp.map(item => ({
    "Sales Order": item.salesOrder.orderNumber,
    "Component Code": item.component.code,
    "Component Name": item.component.name,
    "Gross Requirement": item.grossRequirement,
    "Available Stock": item.availableStock,
    "Net Shortage": item.shortageQty,
    "Shortage Week": item.shortageWeek || "—"
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Reports</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate, audit, and export CSV tabular reports for material requirements, logistics tracking, and payments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Inventory Report Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between h-48">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FileBarChart className="text-primary h-4.5 w-4.5" /> Inventory Health Report
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Active stock balances, warehouse allocation logs, opening balances and reorder threshold levels.
            </p>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
            <span className="text-[10px] text-muted-foreground">{inventory.length} active ledger lines</span>
            <ExportCSVButton data={inventoryCSVData} filename="inventory_health_report.csv" />
          </div>
        </div>

        {/* Revenue Report Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between h-48">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FileBarChart className="text-primary h-4.5 w-4.5" /> Revenue & Receivables Ledger
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Payment trackers, billing invoices, payment statuses, and monthly sales trends per customer.
            </p>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
            <span className="text-[10px] text-muted-foreground">{revenue.length} payment records</span>
            <ExportCSVButton data={revenueCSVData} filename="revenue_billing_report.csv" />
          </div>
        </div>

        {/* Production Report Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between h-48">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FileBarChart className="text-primary h-4.5 w-4.5" /> Production Assembly Output
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Planned vs actual manufactured quantities, rejected scrap counts, and final yield calculations.
            </p>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
            <span className="text-[10px] text-muted-foreground">{production.length} production orders</span>
            <ExportCSVButton data={productionCSVData} filename="production_output_report.csv" />
          </div>
        </div>

        {/* Dispatch Report Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between h-48">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FileBarChart className="text-primary h-4.5 w-4.5" /> Customer Shipping Manifests
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Manifest waybills, courier tracking, actual shipped quantities, and delivery status logs.
            </p>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
            <span className="text-[10px] text-muted-foreground">{dispatches.length} dispatch logs</span>
            <ExportCSVButton data={dispatchCSVData} filename="shipping_dispatch_report.csv" />
          </div>
        </div>

        {/* Material Requirement Report Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between h-48">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FileBarChart className="text-primary h-4.5 w-4.5" /> Material Requirements (MRP)
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Calculated gross requirements, material planning shortages, and estimated shortage week forecasts.
            </p>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
            <span className="text-[10px] text-muted-foreground">{mrp.length} planning rows</span>
            <ExportCSVButton data={mrpCSVData} filename="mrp_planning_report.csv" />
          </div>
        </div>
      </div>
    </div>
  );
}
