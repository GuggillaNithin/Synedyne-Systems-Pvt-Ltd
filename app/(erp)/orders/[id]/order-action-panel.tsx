"use client";

import * as React from "react";
import { Check, X, Truck, RefreshCw, FileText } from "lucide-react";
import { approveOrderAction, cancelOrderAction, dispatchOrderAction } from "@/app/actions/orders";
import { toast } from "sonner";

interface OrderActionPanelProps {
  orderId: string;
  status: string;
  items: Array<{ productId: string; quantity: number; product: { name: string } }>;
}

export function OrderActionPanel({ orderId, status, items }: OrderActionPanelProps) {
  const [loading, setLoading] = React.useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await approveOrderAction(orderId);
      if (res.success) {
        toast.success("Order approved successfully!");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to approve order");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order? Reserved stock will be released.")) return;
    setLoading(true);
    try {
      const res = await cancelOrderAction(orderId);
      if (res.success) {
        toast.success("Order cancelled and stock released.");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to cancel order");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    setLoading(true);
    const totalQty = items.reduce((sum: any, i: any) => sum + i.quantity, 0);
    const dispatchData = {
      actualQty: totalQty,
      items: items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };

    try {
      toast.info("Registering logistics shipment, creating tax invoice and recording revenue...");
      const res = await dispatchOrderAction(orderId, dispatchData);
      if (res.success) {
        toast.success("Order fully dispatched! Invoice generated & Revenue processed.");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to dispatch order");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED" || status === "IN_PRODUCTION";
  const isCancelled = status === "CANCELLED";
  const isInvoiced = status === "INVOICED" || status === "DISPATCHED";

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operational Actions</h3>
      <div className="space-y-2">
        {isPending && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-75"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            Approve & Reserve Stock
          </button>
        )}

        {isApproved && (
          <button
            onClick={handleDispatch}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-75"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Truck size={14} />}
            Dispatch & Bill Customer
          </button>
        )}

        {!isCancelled && !isInvoiced && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border border-destructive/20 hover:bg-destructive/10 text-destructive font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-75"
          >
            Cancel Order
          </button>
        )}

        {isInvoiced && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center space-y-2">
            <span className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1.5">
              <Check size={16} /> Fully Processed
            </span>
            <p className="text-[10px] text-muted-foreground">Order completed, dispatched, and invoiced.</p>
          </div>
        )}

        {isCancelled && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center space-y-2">
            <span className="text-xs font-bold text-red-500 flex items-center justify-center gap-1.5">
              <X size={16} /> Order Cancelled
            </span>
            <p className="text-[10px] text-muted-foreground">Historical reservation record released.</p>
          </div>
        )}
      </div>
    </div>
  );
}
export default OrderActionPanel;
