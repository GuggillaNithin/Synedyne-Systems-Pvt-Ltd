"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw, DollarSign } from "lucide-react";
import { recordPaymentAction } from "@/app/actions/revenue";

interface PaymentRecordButtonsProps {
  invoiceId: string;
  totalAmount: number;
  dueAmount: number;
  status: string;
}

export function PaymentRecordButtons({ invoiceId, totalAmount, dueAmount, status }: PaymentRecordButtonsProps) {
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [amount, setAmount] = React.useState(String(dueAmount));

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0 || payAmt > dueAmount) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setLoading(true);
    try {
      const res = await recordPaymentAction(invoiceId, payAmt);
      if (res.success) {
        toast.success(`Payment of ₹${payAmt.toLocaleString("en-IN")} recorded successfully!`);
        setShowModal(false);
      } else {
        toast.error("Failed to record payment");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "PAID") {
    return <span className="text-[10px] text-emerald-500 font-semibold">Settled</span>;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
      >
        <DollarSign size={10} />
        Record Payment
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border bg-muted/20 text-left">
              <h3 className="font-bold text-sm text-foreground">Record Wire Payment</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Settle outstanding invoice amounts</p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-left">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Due Balance:</span>
                  <span className="text-foreground">₹{dueAmount.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="number"
                  max={dueAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-75 cursor-pointer"
                >
                  {loading ? <RefreshCw size={12} className="animate-spin" /> : null}
                  Record Wire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
export default PaymentRecordButtons;
