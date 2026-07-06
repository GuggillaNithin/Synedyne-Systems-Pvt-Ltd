import { prisma } from "@/lib/db";
import type { Customer, Prisma } from "@prisma/client";
import type { PaginationParams } from "@/types";

export class CustomerRepository {
  async findAll(params: PaginationParams = {}) {
    const { page = 1, pageSize = 20, search, sortBy = "name", sortOrder = "asc" } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findById(id: string): Promise<Customer | null> {
    return prisma.customer.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(code: string): Promise<Customer | null> {
    return prisma.customer.findFirst({ where: { code, deletedAt: null } });
  }

  async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return prisma.customer.create({ data });
  }

  async update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return prisma.customer.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async upsertByCode(code: string, data: Prisma.CustomerCreateInput): Promise<Customer> {
    return prisma.customer.upsert({
      where: { code },
      create: data,
      update: { name: data.name, updatedAt: new Date() },
    });
  }
}

export const customerRepository = new CustomerRepository();
