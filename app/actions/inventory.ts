"use server";

import { revalidatePath } from "next/cache";
import { inventoryService } from "@/services/inventory.service";

export async function listInventoryAction(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  try {
    const result = await inventoryService.getInventoryWithAvailability(params);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to list inventory" };
  }
}

export async function adjustInventoryAction(data: {
  inventoryId: string;
  quantity: number;
  notes?: string;
}) {
  try {
    const { prisma } = await import("@/lib/db");
    const inventory = await prisma.inventory.findUnique({
      where: { id: data.inventoryId },
    });
    if (!inventory) throw new Error("Inventory item not found");

    const newStock = inventory.currentStock + data.quantity;
    if (newStock < 0) throw new Error("Stock quantity cannot be negative");

    await prisma.inventory.update({
      where: { id: data.inventoryId },
      data: { currentStock: newStock },
    });

    await prisma.inventoryTransaction.create({
      data: {
        inventoryId: data.inventoryId,
        transactionType: "ADJUST",
        quantity: Math.abs(data.quantity),
        balanceAfter: newStock,
        notes: data.notes || "Manual stock adjustment",
      },
    });

    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to adjust inventory" };
  }
}
