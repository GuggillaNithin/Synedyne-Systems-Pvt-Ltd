"use client";

import * as React from "react";
import { adjustInventoryAction } from "@/app/actions/inventory";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

interface AdjustInventoryFormProps {
  inventoryId: string;
}

export function AdjustInventoryForm({ inventoryId }: AdjustInventoryFormProps) {
  const [qty, setQty] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [show, setShow] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQty = Number(qty);
    if (isNaN(parsedQty) || parsedQty === 0) {
      toast.error("Enter a valid non-zero adjustment quantity");
      return;
    }

    setLoading(true);
    try {
      const res = await adjustInventoryAction({
        inventoryId,
        quantity: parsedQty,
        notes: "Manual adjustment via warehouse panel",
      });

      if (res.success) {
        toast.success("Inventory stock levels updated!");
        setQty("");
        setShow(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to adjust stock");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-[10px] font-semibold text-primary border border-primary/20 hover:bg-primary/10 px-2 py-1 rounded-md transition-colors cursor-pointer"
      >
        Adjust Stock
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5 justify-end">
      <input
        type="number"
        placeholder="+/- qty"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-16 bg-muted/40 border border-border rounded-md px-1.5 py-1 text-[10px] text-foreground focus:outline-hidden"
        required
        autoFocus
      />
      <button
        type="submit"
        disabled={loading}
        className="text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-1 rounded-md hover:bg-primary/95 transition-colors disabled:opacity-75 cursor-pointer flex items-center gap-1"
      >
        {loading ? <RefreshCw size={8} className="animate-spin" /> : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setQty("");
          setShow(false);
        }}
        className="text-[10px] text-muted-foreground border border-border hover:bg-muted px-2 py-1 rounded-md transition-colors cursor-pointer"
      >
        Cancel
      </button>
    </form>
  );
}
export default AdjustInventoryForm;
