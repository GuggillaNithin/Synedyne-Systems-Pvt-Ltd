import { prisma } from "@/lib/db";
import type { Product, Prisma } from "@prisma/client";
import type { PaginationParams } from "@/types";

export class ProductRepository {
  async findAll(params: PaginationParams = {}) {
    const { page = 1, pageSize = 20, search, sortBy = "name", sortOrder = "asc" } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: pageSize, orderBy: { [sortBy]: sortOrder } }),
      prisma.product.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(code: string): Promise<Product | null> {
    return prisma.product.findFirst({ where: { code, deletedAt: null } });
  }

  async findMany(ids: string[]): Promise<Product[]> {
    return prisma.product.findMany({ where: { id: { in: ids }, deletedAt: null } });
  }

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.create({ data });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return prisma.product.update({ where: { id }, data });
  }

  async upsertByCode(code: string, data: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.upsert({
      where: { code },
      create: data,
      update: { name: data.name, sellingPrice: data.sellingPrice, updatedAt: new Date() },
    });
  }
}

export const productRepository = new ProductRepository();
