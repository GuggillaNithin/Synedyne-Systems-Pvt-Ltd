import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { PaginationParams } from "@/types";

export class BOMRepository {
  async findByProductId(productId: string) {
    return prisma.bOMItem.findMany({
      where: { productId, isActive: true },
      include: {
        component: true,
        product: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ pcba: "asc" }, { component: { name: "asc" } }],
    });
  }

  async findByProductIds(productIds: string[]) {
    return prisma.bOMItem.findMany({
      where: { productId: { in: productIds }, isActive: true },
      include: { component: true, product: true },
    });
  }

  async findAll(params: PaginationParams & { productId?: string } = {}) {
    const { page = 1, pageSize = 20, search, productId } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.BOMItemWhereInput = {
      isActive: true,
      ...(productId && { productId }),
      ...(search && {
        OR: [
          { component: { name: { contains: search, mode: "insensitive" } } },
          { component: { code: { contains: search, mode: "insensitive" } } },
          { product: { name: { contains: search, mode: "insensitive" } } },
          { pcba: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.bOMItem.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          component: true,
          product: { select: { id: true, code: true, name: true } },
        },
        orderBy: [{ product: { name: "asc" } }, { pcba: "asc" }],
      }),
      prisma.bOMItem.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async upsert(productId: string, componentId: string, data: { pcba?: string; qtyPerProduct: number; unit?: string }) {
    return prisma.bOMItem.upsert({
      where: { productId_componentId: { productId, componentId } },
      create: {
        productId,
        componentId,
        pcba: data.pcba,
        qtyPerProduct: data.qtyPerProduct,
        unit: data.unit ?? "pcs",
      },
      update: {
        pcba: data.pcba,
        qtyPerProduct: data.qtyPerProduct,
        unit: data.unit ?? "pcs",
        updatedAt: new Date(),
      },
    });
  }
}

export const bomRepository = new BOMRepository();
