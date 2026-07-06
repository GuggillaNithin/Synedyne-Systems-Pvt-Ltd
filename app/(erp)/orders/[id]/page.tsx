import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, CheckCircle2, AlertTriangle, Play, Calendar, User, 
  MapPin, ShieldCheck, ShoppingBag, Truck, DollarSign, FileText 
} from "lucide-react";
import { orderService } from "@/services/order.service";
import { formatCurrency, formatNumber, formatDate, formatDateTime } from "@/lib/utils";
import { OrderActionPanel } from "./order-action-panel";

export const revalidate = 0; // Dynamic route

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let order;
  try {
    order = await orderService.getOrderById(id);
  } catch (error) {
    notFound();
  }

  const itemsCount = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);

  const actionPanelItems = order.items.map((item) => ({
    productId: item.productId,
    quantity: Number(item.quantity),
    product: { name: item.product.name },
  }));

  // Compute status steps for the Timeline
  const steps = [
    { label: "Draft Created", active: true, desc: "Order drafted in database.", date: order.createdAt },
    { label: "Awaiting Approval", active: ["PENDING", "APPROVED", "IN_PRODUCTION", "DISPATCHED", "INVOICED"].includes(order.status), desc: "Reviewing bill of materials & inventory availability." },
    { label: "Order Approved", active: ["APPROVED", "IN_PRODUCTION", "DISPATCHED", "INVOICED"].includes(order.status), desc: "Inventory stocks reserved from Raw Material Store.", date: order.approvedAt },
    { label: "In Production", active: ["IN_PRODUCTION", "DISPATCHED", "INVOICED"].includes(order.status), desc: "Production queue logs generated." },
    { label: "Fulfilled & Dispatched", active: ["DISPATCHED", "INVOICED"].includes(order.status), desc: "Dispatched from Finished Goods warehouse." },
    { label: "Invoice Settled", active: order.status === "INVOICED", desc: "Payment processed in revenue tracker." },
  ];

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="p-2 border border-border bg-card rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Order Workspace: {order.orderNumber}
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
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">Created on {formatDate(order.orderDate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Details, Items, Material Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-card border border-border rounded-xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-xs">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Customer Details</span>
              <div className="font-semibold text-xs flex items-center gap-2">
                <User size={14} className="text-muted-foreground" />
                {order.customer.name}
              </div>
              <span className="text-[10px] text-muted-foreground block">{order.customer.code}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Expected Date</span>
              <div className="font-semibold text-xs flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                {formatDate(order.deliveryDate)}
              </div>
              <span className="text-[10px] text-muted-foreground block">Required lead time</span>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Financial Summary</span>
              <div className="font-bold text-xs flex items-center gap-2 text-primary">
                <DollarSign size={14} />
                {formatCurrency(order.totalAmount)}
              </div>
              <span className="text-[10px] text-muted-foreground block">{itemsCount} units ordered</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/10">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Items</h3>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Qty Ordered</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground">{item.product.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.product.code}</div>
                    </td>
                    <td className="px-5 py-4 font-medium">{formatNumber(item.quantity)} {item.product.unit}</td>
                    <td className="px-5 py-4">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-5 py-4 font-semibold">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Material Planning & Shortage report */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Material Planning & MRP Shortages</h3>
              {order.materialPlans.some((p: any) => p.shortageQty > 0) ? (
                <span className="flex items-center gap-1 text-[10px] bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-semibold">
                  <AlertTriangle size={10} /> Shortage Detected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">
                  <ShieldCheck size={10} /> Materials Allocated
                </span>
              )}
            </div>
            {order.materialPlans.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No material plans recorded for this order yet.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Component</th>
                    <th className="px-5 py-3">Gross Req</th>
                    <th className="px-5 py-3">Available</th>
                    <th className="px-5 py-3">Shortage Qty</th>
                    <th className="px-5 py-3">Lead Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.materialPlans.map((plan: any) => (
                    <tr key={plan.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{plan.component.code}</div>
                        <div className="text-[10px] text-muted-foreground">{plan.component.name}</div>
                      </td>
                      <td className="px-5 py-4">{formatNumber(plan.grossRequirement)}</td>
                      <td className="px-5 py-4 text-muted-foreground">{formatNumber(plan.availableStock)}</td>
                      <td className="px-5 py-4">
                        {plan.shortageQty > 0 ? (
                          <span className="text-red-500 font-bold">{formatNumber(plan.shortageQty)}</span>
                        ) : (
                          <span className="text-emerald-500 font-semibold">0 (Reserved)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{plan.leadTimeWeeks} weeks</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Actions Panel and Orlando Timeline */}
        <div className="space-y-6">
          {/* Actions panel */}
          <OrderActionPanel orderId={order.id} status={order.status} items={actionPanelItems} />

          {/* Timeline visualization */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Lifecycle Timeline</h3>
            <div className="relative border-l border-border pl-6 ml-3 space-y-6 py-2 text-xs">
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Circular Node */}
                  <span className={`absolute -left-[30px] top-1 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                    step.active
                      ? "bg-primary border-primary text-primary-foreground text-[8px] font-bold"
                      : "bg-card border-border text-muted-foreground text-[8px]"
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="space-y-0.5">
                    <div className={`font-semibold ${step.active ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">{step.desc}</div>
                    {step.date && (
                      <div className="text-[9px] text-primary/80 font-medium mt-1">{formatDateTime(step.date)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
