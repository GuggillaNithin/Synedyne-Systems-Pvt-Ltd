import { prisma } from "@/lib/db";
import type { ProductionOrder, Prisma } from "@prisma/client";
import type { PaginationParams } from "@/types";

export class ProductionRepository {
  async findAll(params: PaginationParams & { status?: string; productId?: string } = {}) {
    const { page = 1, pageSize = 20, search, sortBy = "plannedDate", sortOrder = "desc", status, productId } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductionOrderWhereInput = {
      ...(status && { status: status as never }),
      ...(productId && { productId }),
      ...(search && {
        OR: [
          { product: { name: { contains: search, mode: "insensitive" } } },
          { product: { code: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.productionOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          product: true,
          salesOrder: { select: { id: true, orderNumber: true } },
          logs: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      }),
      prisma.productionOrder.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findById(id: string) {
    return prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        salesOrder: true,
        logs: { orderBy: { createdAt: "desc" } },
        finishedGoods: true,
      },
    });
  }

  async create(data: Prisma.ProductionOrderCreateInput): Promise<ProductionOrder> {
    return prisma.productionOrder.create({ data });
  }

  async update(id: string, data: Prisma.ProductionOrderUpdateInput): Promise<ProductionOrder> {
    return prisma.productionOrder.update({ where: { id }, data });
  }

  async addLog(productionOrderId: string, logType: string, message: string, createdBy?: string) {
    return prisma.productionLog.create({
      data: { productionOrderId, logType, message, createdBy },
    });
  }

  async getEfficiencyStats() {
    const result = await prisma.productionOrder.aggregate({
      where: { status: "COMPLETED" },
      _sum: { plannedQty: true, actualQty: true, rejectedQty: true, finishedQty: true },
    });
    const planned = Number(result._sum.plannedQty ?? 0);
    const finished = Number(result._sum.finishedQty ?? 0);
    const efficiency = planned > 0 ? (finished / planned) * 100 : 0;
    return { efficiency, planned, finished, rejected: Number(result._sum.rejectedQty ?? 0) };
  }

  async upsertFromPlan(data: {
    productId: string;
    plannedDate: Date;
    plannedQty: number;
    actualQty: number;
    rejectedQty: number;
    finishedQty: number;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "ON_HOLD";
  }) {
    return prisma.productionOrder.create({ data });
  }
}

export const productionRepository = new ProductionRepository();
