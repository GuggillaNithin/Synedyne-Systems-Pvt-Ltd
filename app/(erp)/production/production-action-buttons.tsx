"use client";

import * as React from "react";
import { Play, CheckCircle2, RefreshCw } from "lucide-react";
import { startProductionAction, completeProductionAction } from "@/app/actions/production";
import { toast } from "sonner";

interface ProductionActionButtonsProps {
  productionId: string;
  status: string;
  plannedQty: number;
}

export function ProductionActionButtons({ productionId, status, plannedQty }: ProductionActionButtonsProps) {
  const [loading, setLoading] = React.useState(false);
  const [showCompleteModal, setShowCompleteModal] = React.useState(false);
  const [actualQty, setActualQty] = React.useState(String(plannedQty));
  const [rejectedQty, setRejectedQty] = React.useState("0");

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await startProductionAction(productionId);
      if (res.success) {
        toast.success("Production order started!");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to start production");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const act = Number(actualQty);
    const rej = Number(rejectedQty);
    if (isNaN(act) || isNaN(rej) || act < 0 || rej < 0 || act < rej) {
      toast.error("Please enter valid quantities");
      return;
    }

    setLoading(true);
    try {
      const res = await completeProductionAction(productionId, {
        actualQty: act,
        rejectedQty: rej,
        notes: "Completed at manufacturing floor",
      });

      if (res.success) {
        toast.success("Production logged! Finished items moved to Finished Goods Store.");
        setShowCompleteModal(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to complete production");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "PENDING") {
    return (
      <button
        onClick={handleStart}
        disabled={loading}
        className="inline-flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/95 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-75"
      >
        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
        Start Build
      </button>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <>
        <button
          onClick={() => setShowCompleteModal(true)}
          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer"
        >
          <CheckCircle2 size={12} />
          Log Completion
        </button>

        {showCompleteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div 
              className="bg-card border border-border w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-border bg-muted/20">
                <h3 className="font-bold text-sm text-foreground">Log Production Details</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Input counts to transfer to Finished Goods store</p>
              </div>

              <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actual Qty Produced</label>
                  <input
                    type="number"
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scrap / Rejected Qty</label>
                  <input
                    type="number"
                    value={rejectedQty}
                    onChange={(e) => setRejectedQty(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    className="px-3 py-1.5 border border-border hover:bg-muted text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-75 cursor-pointer"
                  >
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : null}
                    Confirm Log
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return <span className="text-[10px] text-muted-foreground font-semibold">Completed</span>;
}
export default ProductionActionButtons;
