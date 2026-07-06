"use server";

import { revalidatePath } from "next/cache";
import { productionService } from "@/services/production.service";

export async function listProductionOrdersAction(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  try {
    const result = await productionService.getAllProductionOrders(params);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to list production orders" };
  }
}

export async function startProductionAction(id: string) {
  try {
    const result = await productionService.startProduction(id);
    revalidatePath("/production");
    revalidatePath("/dashboard");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to start production" };
  }
}

export async function completeProductionAction(
  id: string,
  data: { actualQty: number; rejectedQty: number; notes?: string }
) {
  try {
    const result = await productionService.completeProduction(id, data);
    revalidatePath("/production");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to complete production" };
  }
}
