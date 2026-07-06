import { prisma } from "@/lib/db";
import { dispatchRepository } from "@/repositories/dispatch.repository";
import type { PaginationParams } from "@/types";

export class DispatchService {
  async getDispatches(params: PaginationParams & { status?: string } = {}) {
    return dispatchRepository.findAll(params);
  }

  async getDispatchDetails(id: string) {
    return dispatchRepository.findById(id);
  }

  async getPendingDispatchCount(): Promise<number> {
    return dispatchRepository.getPendingCount();
  }

  async updateDispatchStatus(
    id: string,
    data: {
      status: "PENDING" | "PARTIAL" | "DISPATCHED" | "DELIVERED" | "RETURNED";
      trackingNumber?: string;
      notes?: string;
    }
  ) {
    return prisma.dispatch.update({
      where: { id },
      data,
    });
  }
}

export const dispatchService = new DispatchService();
