"use server";

import { revalidatePath } from "next/cache";
import { emsService } from "@/services/ems.service";

export async function listEMSBuildPlanAction(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  try {
    const result = await emsService.getBuildPlan(params);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to list EMS builds" };
  }
}

export async function updateEMSBuildPlanAction(
  id: string,
  data: {
    actualQty?: number;
    rejectedQty?: number;
    goodQty?: number;
    dispatchToSynedyne?: number;
    status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  }
) {
  try {
    const result = await emsService.updateBuildRecord(id, data);
    revalidatePath("/ems/build-plan");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update EMS build record" };
  }
}

export async function listEMSDispatchAction(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  try {
    const result = await emsService.getDispatchPlan(params);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to list EMS dispatches" };
  }
}
