import { prisma } from "@/lib/db";
import { orderRepository } from "@/repositories/order.repository";
import { customerRepository } from "@/repositories/customer.repository";
import { bomService } from "@/services/bom.service";
import { inventoryService } from "@/services/inventory.service";
import { materialPlanningService } from "@/services/material-planning.service";
import { productionService } from "@/services/production.service";
import { notificationService } from "@/services/notification.service";
import { auditService } from "@/services/audit.service";
import { generateOrderNumber, generateInvoiceNumber } from "@/lib/utils";
import { CreateOrderSchema } from "@/validators";
import type { CreateOrderDTO, OrderWorkflowResult } from "@/types";

export class OrderService {
  /**
   * MAIN ENTRY POINT: Create a new sales order and trigger the full
   * manufacturing workflow automatically.
   *
   * Workflow:
   * 1. Validate customer and products
   * 2. Save order + items
   * 3. Read BOM for each product
   * 4. Calculate gross material requirements
   * 5. Check inventory for net requirements
   * 6. Detect shortages → create MaterialPlan records
   * 7. Generate purchase requests for shortages
   * 8. Reserve available stock
   * 9. Create production orders
   * 10. Notify
   * 11. Audit log
   */
  async createOrder(
    dto: CreateOrderDTO,
    userId?: string
  ): Promise<OrderWorkflowResult> {
    // --- Step 1: Validate input ---
    const validated = CreateOrderSchema.parse(dto);

    // --- Step 2: Validate customer exists ---
    const customer = await customerRepository.findById(validated.customerId);
    if (!customer) throw new Error(`Customer not found: ${validated.customerId}`);

    // --- Step 3: Calculate order total ---
    const totalAmount = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // --- Step 4: Create order in transaction ---
    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const salesOrder = await tx.salesOrder.create({
        data: {
          orderNumber,
          customerId: validated.customerId,
          status: "PENDING",
          orderDate: new Date(),
          deliveryDate: validated.deliveryDate,
          notes: validated.notes,
          totalAmount,
          createdBy: userId,
          items: {
            create: validated.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
      });
      return salesOrder;
    });

    // --- Step 5: Calculate gross material requirements (BOM) ---
    const grossRequirements = await bomService.calculateMultiProductRequirements(
      validated.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    // --- Step 6: Calculate net requirements (check inventory) ---
    const netRequirements = await materialPlanningService.calculateNetRequirements(
      grossRequirements
    );

    // --- Step 7: Save material plans ---
    const materialPlanIds = await materialPlanningService.saveMaterialPlans(
      order.id,
      netRequirements
    );

    // --- Step 8: Generate purchase requests for shortages ---
    const shortageRequirements = netRequirements.filter((r) => r.shortageQty > 0);
    const purchaseRequestIds = await materialPlanningService.generatePurchaseRequests(
      shortageRequirements,
      materialPlanIds
    );

    const hasShortages = shortageRequirements.length > 0;

    // --- Step 9: Reserve available stock ---
    const reservationRequirements = netRequirements
      .filter((r) => r.availableStock > 0)
      .map((r) => ({
        componentId: r.componentId,
        quantity: Math.min(r.grossRequirement, r.availableStock),
      }));

    const reservationResults = await inventoryService.reserveStockForRequirements(
      reservationRequirements
    );

    // --- Step 10: Create production orders for each product ---
    const productionOrderIds: string[] = [];

    for (const item of validated.items) {
      const productionOrder = await productionService.createProductionOrder({
        salesOrderId: order.id,
        productId: item.productId,
        plannedQty: item.quantity,
        plannedDate: validated.deliveryDate ?? new Date(),
        notes: `Auto-created from Order ${orderNumber}`,
      });
      productionOrderIds.push(productionOrder.id);
    }

    // --- Step 11: Notifications ---
    await notificationService.create({
      type: "ORDER_CREATED",
      title: "New Sales Order Created",
      message: `Order ${orderNumber} created for ${customer.name}. ${hasShortages ? "Material shortages detected!" : "All materials available."}`,
      userId,
      referenceId: order.id,
      referenceType: "SalesOrder",
    });

    if (hasShortages) {
      await notificationService.create({
        type: "MATERIAL_SHORTAGE",
        title: "Material Shortage Detected",
        message: `${shortageRequirements.length} components are short for Order ${orderNumber}. Purchase requests generated.`,
        referenceId: order.id,
        referenceType: "SalesOrder",
      });
    }

    // --- Step 12: Audit log ---
    await auditService.log({
      action: "CREATE",
      entity: "SalesOrder",
      entityId: order.id,
      newValue: { orderNumber, customerId: validated.customerId, totalAmount },
      userId,
    });

    return {
      orderId: order.id,
      orderNumber,
      materialPlans: materialPlanIds,
      purchaseRequests: purchaseRequestIds,
      productionOrderIds,
      reservationResults,
      hasShortages,
    };
  }

  /**
   * Approve a sales order.
   */
  async approveOrder(orderId: string, userId?: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "PENDING") throw new Error("Only PENDING orders can be approved");

    const updated = await orderRepository.update(orderId, {
      status: "APPROVED",
      approvedBy: userId,
      approvedAt: new Date(),
    });

    await notificationService.create({
      type: "ORDER_APPROVED",
      title: "Order Approved",
      message: `Order ${order.orderNumber} has been approved`,
      userId,
      referenceId: orderId,
      referenceType: "SalesOrder",
    });

    await auditService.log({
      action: "APPROVE",
      entity: "SalesOrder",
      entityId: orderId,
      oldValue: { status: "PENDING" },
      newValue: { status: "APPROVED" },
      userId,
    });

    return updated;
  }

  /**
   * Cancel a sales order and release reserved stock.
   */
  async cancelOrder(orderId: string, userId?: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status === "CANCELLED") throw new Error("Order is already cancelled");
    if (order.status === "INVOICED") throw new Error("Cannot cancel an invoiced order");

    // Release reserved inventory
    const materialPlans = await prisma.materialPlan.findMany({
      where: { salesOrderId: orderId },
      include: { component: true },
    });

    for (const plan of materialPlans) {
      if (plan.availableStock > 0) {
        await inventoryService.releaseStock(
          plan.componentId,
          Math.min(plan.grossRequirement, plan.availableStock)
        );
      }
    }

    const updated = await orderRepository.softDelete(orderId);

    await auditService.log({
      action: "CANCEL",
      entity: "SalesOrder",
      entityId: orderId,
      oldValue: { status: order.status },
      newValue: { status: "CANCELLED" },
      userId,
    });

    return updated;
  }

  /**
   * Dispatch an order and generate invoice.
   */
  async dispatchOrder(
    orderId: string,
    dispatchData: { actualQty: number; items: Array<{ productId: string; quantity: number }> },
    userId?: string
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Create dispatch record
    const dispatch = await prisma.dispatch.create({
      data: {
        salesOrderId: orderId,
        customerId: order.customerId,
        dispatchDate: new Date(),
        plannedQty: order.items.reduce((sum, i) => sum + i.quantity, 0),
        actualQty: dispatchData.actualQty,
        status: "DISPATCHED",
        items: {
          create: dispatchData.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        },
      },
    });

    // Generate invoice
    const invoiceNumber = generateInvoiceNumber();
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        salesOrderId: orderId,
        customerId: order.customerId,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        totalAmount: order.totalAmount,
        status: "SENT",
      },
    });

    // Update order status
    await orderRepository.update(orderId, { status: "INVOICED" });

    // Notifications
    await notificationService.create({
      type: "DISPATCH_COMPLETED",
      title: "Order Dispatched",
      message: `Order ${order.orderNumber} dispatched. Invoice ${invoiceNumber} generated.`,
      referenceId: orderId,
      referenceType: "SalesOrder",
    });

    await notificationService.create({
      type: "INVOICE_GENERATED",
      title: "Invoice Generated",
      message: `Invoice ${invoiceNumber} generated for ₹${Number(order.totalAmount).toLocaleString("en-IN")}`,
      referenceId: invoice.id,
      referenceType: "Invoice",
    });

    await auditService.log({
      action: "DISPATCH",
      entity: "SalesOrder",
      entityId: orderId,
      newValue: { dispatchId: dispatch.id, invoiceId: invoice.id },
      userId,
    });

    return { dispatch, invoice };
  }

  /**
   * Get order detail by ID.
   */
  async getOrderById(id: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw new Error("Order not found");
    return order;
  }

  /**
   * List all orders with filters.
   */
  async listOrders(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    customerId?: string;
  } = {}) {
    return orderRepository.findAll(params);
  }

  /**
   * Update order (draft/pending only).
   */
  async updateOrder(id: string, data: { deliveryDate?: Date; notes?: string }, userId?: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw new Error("Order not found");
    if (!["DRAFT", "PENDING"].includes(order.status)) {
      throw new Error("Can only edit DRAFT or PENDING orders");
    }

    const updated = await orderRepository.update(id, data);

    await auditService.log({
      action: "UPDATE",
      entity: "SalesOrder",
      entityId: id,
      oldValue: { deliveryDate: order.deliveryDate, notes: order.notes },
      newValue: data,
      userId,
    });

    return updated;
  }
}

export const orderService = new OrderService();
