import { prisma } from "@/lib/db";
import { notificationService } from "@/services/notification.service";

export class ProductionService {
  /**
   * Create a production order linked to a sales order.
   */
  async createProductionOrder(data: {
    salesOrderId?: string;
    productId: string;
    plannedQty: number;
    plannedDate?: Date;
    notes?: string;
  }) {
    const productionOrder = await prisma.productionOrder.create({
      data: {
        salesOrderId: data.salesOrderId,
        productId: data.productId,
        plannedQty: data.plannedQty,
        plannedDate: data.plannedDate ?? new Date(),
        status: "PENDING",
        notes: data.notes,
      },
    });

    await prisma.productionLog.create({
      data: {
        productionOrderId: productionOrder.id,
        logType: "CREATED",
        message: `Production order created for ${data.plannedQty} units`,
      },
    });

    await notificationService.create({
      type: "PRODUCTION_STARTED",
      title: "Production Order Created",
      message: `New production order created for ${data.plannedQty} units`,
    });

    return productionOrder;
  }

  /**
   * Start production — sets status to IN_PROGRESS.
   */
  async startProduction(productionOrderId: string) {
    const order = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });

    await prisma.productionLog.create({
      data: {
        productionOrderId,
        logType: "STARTED",
        message: "Production started",
      },
    });

    return order;
  }

  /**
   * Complete production — records actual, rejected, finished quantities.
   */
  async completeProduction(
    productionOrderId: string,
    data: { actualQty: number; rejectedQty: number; notes?: string }
  ) {
    const finishedQty = Math.max(0, data.actualQty - data.rejectedQty);

    const order = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        status: "COMPLETED",
        actualQty: data.actualQty,
        rejectedQty: data.rejectedQty,
        finishedQty,
        completedAt: new Date(),
        notes: data.notes,
      },
      include: { product: true },
    });

    // Move to Finished Goods
    await prisma.finishedGood.create({
      data: {
        productionOrderId,
        productId: order.productId,
        quantity: finishedQty,
        warehouseLocation: "Finished Goods Store",
        receivedAt: new Date(),
      },
    });

    await prisma.productionLog.create({
      data: {
        productionOrderId,
        logType: "COMPLETED",
        message: `Completed: ${data.actualQty} produced, ${data.rejectedQty} rejected, ${finishedQty} finished`,
      },
    });

    await notificationService.create({
      type: "PRODUCTION_COMPLETED",
      title: "Production Completed",
      message: `${order.product.name}: ${finishedQty} units moved to Finished Goods`,
    });

    return order;
  }

  /**
   * Get production efficiency statistics.
   */
  async getEfficiencyStats() {
    const result = await prisma.productionOrder.aggregate({
      where: { status: "COMPLETED" },
      _sum: { plannedQty: true, actualQty: true, rejectedQty: true, finishedQty: true },
      _count: { id: true },
    });

    const planned = Number(result._sum.plannedQty ?? 0);
    const finished = Number(result._sum.finishedQty ?? 0);
    const rejected = Number(result._sum.rejectedQty ?? 0);
    const efficiency = planned > 0 ? Math.round((finished / planned) * 100) : 0;

    return { efficiency, planned, finished, rejected, totalOrders: result._count.id };
  }

  /**
   * Get all production orders with pagination and filters.
   */
  async getAllProductionOrders(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  } = {}) {
    const { page = 1, pageSize = 20, search, status } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(status && { status: status as never }),
      ...(search && {
        OR: [
          { product: { name: { contains: search, mode: "insensitive" as const } } },
          { product: { code: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.productionOrder.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          product: true,
          salesOrder: { select: { id: true, orderNumber: true } },
          _count: { select: { logs: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.productionOrder.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}

export const productionService = new ProductionService();
