import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { PaginationParams } from "@/types";

export class RevenueRepository {
  async findAll(params: PaginationParams & { paymentStatus?: string; month?: string } = {}) {
    const { page = 1, pageSize = 20, search, sortBy = "createdAt", sortOrder = "desc", paymentStatus, month } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.RevenueWhereInput = {
      ...(paymentStatus && { paymentStatus: paymentStatus as never }),
      ...(month && { month: { contains: month } }),
      ...(search && {
        OR: [
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { product: { name: { contains: search, mode: "insensitive" } } },
          { month: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.revenue.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          product: { select: { id: true, name: true, code: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
      }),
      prisma.revenue.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getTotalRevenue(): Promise<number> {
    const result = await prisma.revenue.aggregate({
      _sum: { revenue: true },
    });
    return Number(result._sum.revenue ?? 0);
  }

  async getMonthlyRevenue(): Promise<Array<{ month: string; revenue: number }>> {
    const data = await prisma.revenue.groupBy({
      by: ["month"],
      _sum: { revenue: true },
      orderBy: { month: "asc" },
    });
    return data.map((d) => ({ month: d.month, revenue: Number(d._sum.revenue ?? 0) }));
  }

  async getTopProducts(limit = 5) {
    const data = await prisma.revenue.groupBy({
      by: ["productId"],
      _sum: { revenue: true, unitsSold: true },
      orderBy: { _sum: { revenue: "desc" } },
      take: limit,
    });
    const productIds = data.map((d) => d.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    return data.map((d) => {
      const product = products.find((p) => p.id === d.productId);
      return {
        productCode: product?.code ?? "",
        productName: product?.name ?? "",
        totalRevenue: Number(d._sum.revenue ?? 0),
        totalUnits: Number(d._sum.unitsSold ?? 0),
      };
    });
  }

  async getTopCustomers(limit = 5) {
    const data = await prisma.revenue.groupBy({
      by: ["customerId"],
      _sum: { revenue: true },
      orderBy: { _sum: { revenue: "desc" } },
      take: limit,
    });
    const customerIds = data.map((d) => d.customerId);
    const customers = await prisma.customer.findMany({ where: { id: { in: customerIds } } });

    return data.map((d) => {
      const customer = customers.find((c) => c.id === d.customerId);
      return {
        customerCode: customer?.code ?? "",
        customerName: customer?.name ?? "",
        totalRevenue: Number(d._sum.revenue ?? 0),
      };
    });
  }

  async create(data: Prisma.RevenueCreateInput) {
    return prisma.revenue.create({ data });
  }

  async upsertFromTracker(data: {
    customerId: string;
    productId: string;
    month: string;
    unitsSold: number;
    sellingPrice: number;
    revenue: number;
    paymentStatus: "PAID" | "PENDING" | "OVERDUE";
  }) {
    return prisma.revenue.create({ data });
  }
}

export const revenueRepository = new RevenueRepository();
