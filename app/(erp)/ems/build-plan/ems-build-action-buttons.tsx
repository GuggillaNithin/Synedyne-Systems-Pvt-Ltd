"use client";

import * as React from "react";
import { updateEMSBuildPlanAction } from "@/app/actions/ems";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2 } from "lucide-react";

interface EMSBuildActionButtonsProps {
  buildId: string;
  plannedQty: number;
  status: string;
}

export function EMSBuildActionButtons({ buildId, plannedQty, status }: EMSBuildActionButtonsProps) {
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [actualQty, setActualQty] = React.useState(String(plannedQty));
  const [rejectedQty, setRejectedQty] = React.useState("0");
  const [dispatchedQty, setDispatchedQty] = React.useState(String(plannedQty));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const act = Number(actualQty);
    const rej = Number(rejectedQty);
    const disp = Number(dispatchedQty);

    if (isNaN(act) || isNaN(rej) || isNaN(disp) || act < 0 || rej < 0 || disp < 0 || act < rej) {
      toast.error("Please enter valid quantities");
      return;
    }

    setLoading(true);
    try {
      const goodQty = act - rej;
      const res = await updateEMSBuildPlanAction(buildId, {
        actualQty: act,
        rejectedQty: rej,
        goodQty,
        dispatchToSynedyne: disp,
        status: "COMPLETED",
      });

      if (res.success) {
        toast.success("EMS build records updated!");
        setShowModal(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to update build plan");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "COMPLETED") {
    return <span className="text-[10px] text-muted-foreground font-semibold">Completed</span>;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/95 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
      >
        Log Output
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border bg-muted/20 text-left">
              <h3 className="font-bold text-sm text-foreground">Log EMS Assembly Output</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Input manufacturing yields and shipped stock counts</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actual Qty Fabricated</label>
                <input
                  type="number"
                  value={actualQty}
                  onChange={(e) => setActualQty(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rejected Qty (QA scrap)</label>
                <input
                  type="number"
                  value={rejectedQty}
                  onChange={(e) => setRejectedQty(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dispatched to Synedyne</label>
                <input
                  type="number"
                  value={dispatchedQty}
                  onChange={(e) => setDispatchedQty(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-border hover:bg-muted text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-75 cursor-pointer"
                >
                  {loading ? <RefreshCw size={12} className="animate-spin" /> : null}
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
export default EMSBuildActionButtons;
