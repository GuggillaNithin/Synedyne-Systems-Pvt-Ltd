"use server";

import { revalidatePath } from "next/cache";
import { importExcelData } from "@/lib/excel/import-engine";

export async function uploadExcelAction(base64Data: string) {
  try {
    const buffer = Buffer.from(base64Data, "base64");
    const result = await importExcelData(buffer);
    if (!result.success) {
      return { success: false, error: result.errorRows[0]?.message || "Import failed" };
    }
    revalidatePath("/dashboard");
    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/bom");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error uploading Excel:", error);
    return { success: false, error: error?.message || "Failed to process Excel file upload" };
  }
}
