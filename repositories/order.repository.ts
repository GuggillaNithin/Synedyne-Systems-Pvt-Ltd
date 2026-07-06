import { prisma } from "@/lib/db";
import type { SalesOrder, Prisma } from "@prisma/client";
import type { PaginationParams } from "@/types";

export class OrderRepository {
  async findAll(params: PaginationParams & { status?: string; customerId?: string } = {}) {
    const { page = 1, pageSize = 20, search, sortBy = "createdAt", sortOrder = "desc", status, customerId } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.SalesOrderWhereInput = {
      deletedAt: null,
      ...(status && { status: status as Prisma.EnumOrderStatusFilter }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          items: {
            include: { product: { select: { id: true, name: true, code: true, unit: true } } },
          },
        },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findById(id: string) {
    return prisma.salesOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        materialPlans: {
          include: { component: true },
        },
        productionOrders: {
          include: { product: true },
        },
        dispatches: true,
        invoices: true,
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<SalesOrder | null> {
    return prisma.salesOrder.findFirst({ where: { orderNumber, deletedAt: null } });
  }

  async create(data: Prisma.SalesOrderCreateInput): Promise<SalesOrder> {
    return prisma.salesOrder.create({ data });
  }

  async update(id: string, data: Prisma.SalesOrderUpdateInput): Promise<SalesOrder> {
    return prisma.salesOrder.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<SalesOrder> {
    return prisma.salesOrder.update({
      where: { id },
      data: { deletedAt: new Date(), status: "CANCELLED" },
    });
  }

  async getStatusCounts() {
    const counts = await prisma.salesOrder.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    });
    return counts;
  }

  async countByStatus(status: string) {
    return prisma.salesOrder.count({
      where: { status: status as never, deletedAt: null },
    });
  }

  async getTotalRevenue(fromDate?: Date): Promise<number> {
    const result = await prisma.salesOrder.aggregate({
      where: {
        deletedAt: null,
        status: { in: ["INVOICED", "DISPATCHED"] },
        ...(fromDate && { createdAt: { gte: fromDate } }),
      },
      _sum: { totalAmount: true },
    });
    return Number(result._sum.totalAmount ?? 0);
  }
}

export const orderRepository = new OrderRepository();
