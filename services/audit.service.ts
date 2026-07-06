import { prisma } from "@/lib/db";
import type { AuditAction } from "@prisma/client";

export class AuditService {
  async log(data: {
    action: AuditAction;
    entity: string;
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
    userId?: string;
    ipAddress?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue ? JSON.parse(JSON.stringify(data.oldValue)) : undefined,
        newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : undefined,
        userId: data.userId,
        ipAddress: data.ipAddress,
      },
    });
  }

  async getAll(params: {
    page?: number;
    pageSize?: number;
    entity?: string;
    action?: string;
    userId?: string;
  } = {}) {
    const { page = 1, pageSize = 50, entity, action, userId } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(entity && { entity }),
      ...(action && { action: action as AuditAction }),
      ...(userId && { userId }),
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}

export const auditService = new AuditService();
