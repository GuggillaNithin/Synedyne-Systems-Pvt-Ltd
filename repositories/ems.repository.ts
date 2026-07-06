import { prisma } from "@/lib/db";
import type { EMSBuild, EMSDispatch, Prisma } from "@prisma/client";
import type { PaginationParams } from "@/types";

export class EMSRepository {
  async findBuilds(params: PaginationParams & { status?: string } = {}) {
    const { page = 1, pageSize = 20, search, status } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.EMSBuildWhereInput = {
      ...(status && { status: status as never }),
      ...(search && {
        pcba: { contains: search, mode: "insensitive" as const },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.eMSBuild.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { week: "desc" },
      }),
      prisma.eMSBuild.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findDispatches(params: PaginationParams = {}) {
    const { page = 1, pageSize = 20, search } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.EMSDispatchWhereInput = {
      ...(search && {
        pcba: { contains: search, mode: "insensitive" as const },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.eMSDispatch.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { emsDispatchDate: "desc" },
      }),
      prisma.eMSDispatch.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async createBuild(data: Prisma.EMSBuildCreateInput): Promise<EMSBuild> {
    return prisma.eMSBuild.create({ data });
  }

  async createDispatch(data: Prisma.EMSDispatchCreateInput): Promise<EMSDispatch> {
    return prisma.eMSDispatch.create({ data });
  }

  async getRejectionRate() {
    const result = await prisma.eMSBuild.aggregate({
      _sum: { actualQty: true, rejectedQty: true },
    });
    const actual = Number(result._sum.actualQty ?? 0);
    const rejected = Number(result._sum.rejectedQty ?? 0);
    return actual > 0 ? (rejected / actual) * 100 : 0;
  }
}

export const emsRepository = new EMSRepository();
