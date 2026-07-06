"use server";

import { revenueService } from "@/services/revenue.service";
import { revalidatePath } from "next/cache";

export async function recordPaymentAction(invoiceId: string, amount: number) {
  try {
    const res = await revenueService.recordPayment(invoiceId, amount, "PAID");
    revalidatePath("/revenue");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return { success: true, data: JSON.parse(JSON.stringify(res)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to record payment" };
  }
}
