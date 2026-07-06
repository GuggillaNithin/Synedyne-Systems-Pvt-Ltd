"use server";

import { notificationService } from "@/services/notification.service";
import { revalidatePath } from "next/cache";

export async function markAllNotificationsReadAction() {
  try {
    await notificationService.markAllAsRead();
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to mark notifications as read" };
  }
}
