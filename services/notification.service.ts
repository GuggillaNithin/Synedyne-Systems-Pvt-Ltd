import { prisma } from "@/lib/db";

export class NotificationService {
  async create(data: {
    type: "LOW_STOCK" | "ORDER_CREATED" | "ORDER_APPROVED" | "PRODUCTION_STARTED" | "PRODUCTION_COMPLETED" | "DISPATCH_COMPLETED" | "INVOICE_GENERATED" | "PAYMENT_RECEIVED" | "MATERIAL_SHORTAGE" | "PURCHASE_REQUEST" | "SUCCESS" | "WARNING" | "ERROR" | "INFO";
    title: string;
    message: string;
    userId?: string;
    referenceId?: string;
    referenceType?: string;
  }) {
    return prisma.notification.create({ data });
  }

  async getAll(params: { page?: number; pageSize?: number; userId?: string; unreadOnly?: boolean } = {}) {
    const { page = 1, pageSize = 20, userId, unreadOnly } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(userId && { userId }),
      ...(unreadOnly && { isRead: false }),
    };

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async markAsRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllAsRead(userId?: string) {
    return prisma.notification.updateMany({
      where: { isRead: false, ...(userId && { userId }) },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId?: string): Promise<number> {
    return prisma.notification.count({
      where: { isRead: false, ...(userId && { userId }) },
    });
  }

  async getRecent(limit = 10) {
    return prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const notificationService = new NotificationService();
