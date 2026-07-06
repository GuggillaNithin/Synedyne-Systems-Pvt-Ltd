import { prisma } from "@/lib/db";
import { revenueRepository } from "@/repositories/revenue.repository";
import type { PaginationParams } from "@/types";

export class RevenueService {
  async getRevenueList(params: PaginationParams & { paymentStatus?: string; month?: string } = {}) {
    return revenueRepository.findAll(params);
  }

  async getMockMetrics() {
    return { totalRevenue: 11800000, outstanding: 3400849 };
  }

  async getRevenueMetrics() {
    const totalRevenue = await revenueRepository.getTotalRevenue();
    
    // Outstanding invoices sum
    const outstandingRes = await prisma.invoice.aggregate({
      where: { status: { in: ["SENT", "OVERDUE"] } },
      _sum: { totalAmount: true, paidAmount: true },
    });
    
    const outstanding = Number(outstandingRes._sum.totalAmount ?? 0) - Number(outstandingRes._sum.paidAmount ?? 0);
    
    // Monthly trend
    const trend = await revenueRepository.getMonthlyRevenue();
    
    // Top performers
    const topProducts = await revenueRepository.getTopProducts(5);
    const topCustomers = await revenueRepository.getTopCustomers(5);

    return {
      totalRevenue,
      outstanding,
      trend,
      topProducts,
      topCustomers,
    };
  }

  async getInvoices(params: PaginationParams & { status?: string } = {}) {
    const { page = 1, pageSize = 20, search, status } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: "insensitive" as const } },
          { customer: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { invoiceDate: "desc" },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          salesOrder: { select: { id: true, orderNumber: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getInvoiceDetails(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        salesOrder: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
      },
    });
  }

  async recordPayment(
    invoiceId: string,
    amount: number,
    paymentStatus: "PAID" | "PENDING" | "OVERDUE"
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new Error("Invoice not found");

    const newPaidAmount = Number(invoice.paidAmount) + amount;
    const isFullyPaid = newPaidAmount >= Number(invoice.totalAmount);
    const newStatus = isFullyPaid ? "PAID" : "SENT";

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus as any,
      },
    });

    // Update corresponding revenue records to paid if invoice is paid
    if (isFullyPaid) {
      await prisma.revenue.updateMany({
        where: { invoiceId },
        data: { paymentStatus: "PAID" },
      });
    }

    return updatedInvoice;
  }
}

export const revenueService = new RevenueService();
