import { prisma } from "@/lib/db";
import type { Dispatch, Prisma } from "@prisma/client";
import type { PaginationParams } from "@/types";

export class DispatchRepository {
  async findAll(params: PaginationParams & { status?: string } = {}) {
    const { page = 1, pageSize = 20, search, status } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.DispatchWhereInput = {
      ...(status && { status: status as never }),
      ...(search && {
        OR: [
          { salesOrder: { orderNumber: { contains: search, mode: "insensitive" as const } } },
          { customer: { name: { contains: search, mode: "insensitive" as const } } },
          { trackingNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.dispatch.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          salesOrder: { select: { id: true, orderNumber: true } },
          items: { include: { product: true } },
        },
      }),
      prisma.dispatch.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findById(id: string) {
    return prisma.dispatch.findUnique({
      where: { id },
      include: {
        customer: true,
        salesOrder: true,
        items: { include: { product: true } },
      },
    });
  }

  async getPendingCount(): Promise<number> {
    return prisma.dispatch.count({
      where: { status: "PENDING" },
    });
  }
}

export const dispatchRepository = new DispatchRepository();
