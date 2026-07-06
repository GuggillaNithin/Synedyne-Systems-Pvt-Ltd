"use client";

import * as React from "react";
import { Plus, Trash, Check, X, RefreshCw } from "lucide-react";
import { createOrderAction } from "@/app/actions/orders";
import { toast } from "sonner";

interface OrderCreationDialogProps {
  customers: Array<{ id: string; name: string; code: string }>;
  products: Array<{ id: string; name: string; code: string; sellingPrice: any }>;
}

export function OrderCreationDialog({ customers, products }: OrderCreationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [customerId, setCustomerId] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Dynamic order items list
  const [items, setItems] = React.useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([
    { productId: "", quantity: 1, unitPrice: 0 },
  ]);

  const handleProductChange = (index: number, prodId: string) => {
    const selectedProd = products.find((p) => p.id === prodId);
    const price = selectedProd ? Number(selectedProd.sellingPrice) : 0;
    const newItems = [...items];
    newItems[index].productId = prodId;
    newItems[index].unitPrice = price;
    setItems(newItems);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].unitPrice = price;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum: any, item: any) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error("Please fill in all product fields with valid quantities");
      return;
    }

    setLoading(true);
    const dto = {
      customerId,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      notes,
      items: items.map((i: any) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
    };

    try {
      toast.info("Triggering automated Manufacturing Planning logic...");
      const res = await createOrderAction(dto);

      if (res.success && res.data) {
        toast.success(`Sales Order ${res.data.orderNumber} created successfully!`);
        if (res.data.hasShortages) {
          toast.warning("Material shortages detected! Purchase suggestions generated.", { duration: 5000 });
        } else {
          toast.success("All raw materials allocated & reserved from stock!");
        }
        setOpen(false);
        // Reset form
        setCustomerId("");
        setDeliveryDate("");
        setNotes("");
        setItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
        // Refresh page
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to create order");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
      >
        <Plus size={16} />
        Create Sales Order
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div>
            <h3 className="font-bold text-sm text-foreground">Create New Sales Order</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Fills customer demand, reviews BOM, and allocates stock</p>
          </div>
          <button 
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Customer</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
              >
                <option value="">Select Customer...</option>
                {customers.map((c: (typeof customers)[number]) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expected Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
              />
            </div>
          </div>

          {/* Items Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ordered items</label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {items.map((item: any, idx: any) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => handleProductChange(idx, e.target.value)}
                    className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                    className="w-20 bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
                  />

                  <input
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                    className="w-24 bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
                  />

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length === 1}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes / Specifications</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. urgent assembly, custom packaging requirements..."
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden"
            />
          </div>

          {/* Total Value */}
          <div className="pt-2 flex justify-between items-center text-xs font-semibold border-t border-border">
            <span className="text-muted-foreground">Total Order Value:</span>
            <span className="text-sm font-bold text-foreground">₹{calculateTotal().toLocaleString("en-IN")}</span>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-75 cursor-pointer"
          >
            {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check size={14} />}
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}
