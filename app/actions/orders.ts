"use server";

import { revalidatePath } from "next/cache";
import { orderService } from "@/services/order.service";
import type { CreateOrderDTO } from "@/types";

export async function createOrderAction(dto: CreateOrderDTO, userId?: string) {
  try {
    const result = await orderService.createOrder(dto, userId);
    revalidatePath("/orders");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { success: false, error: error?.message || "Failed to create order" };
  }
}

export async function approveOrderAction(orderId: string, userId?: string) {
  try {
    const result = await orderService.approveOrder(orderId, userId);
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/dashboard");
    revalidatePath("/production");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Error approving order:", error);
    return { success: false, error: error?.message || "Failed to approve order" };
  }
}

export async function cancelOrderAction(orderId: string, userId?: string) {
  try {
    const result = await orderService.cancelOrder(orderId, userId);
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    return { success: false, error: error?.message || "Failed to cancel order" };
  }
}

export async function getOrderAction(id: string) {
  try {
    const result = await orderService.getOrderById(id);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to get order" };
  }
}

export async function listOrdersAction(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
}) {
  try {
    const result = await orderService.listOrders(params);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to list orders" };
  }
}

export async function dispatchOrderAction(
  orderId: string,
  dispatchData: { actualQty: number; items: Array<{ productId: string; quantity: number }> },
  userId?: string
) {
  try {
    const result = await orderService.dispatchOrder(orderId, dispatchData, userId);
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/dispatch");
    revalidatePath("/revenue");
    revalidatePath("/dashboard");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Error dispatching order:", error);
    return { success: false, error: error?.message || "Failed to dispatch order" };
  }
}
