import { prisma } from "@/lib/db";
import { emsRepository } from "@/repositories/ems.repository";
import type { PaginationParams } from "@/types";

export class EMSService {
  async getBuildPlan(params: PaginationParams & { status?: string } = {}) {
    return emsRepository.findBuilds(params);
  }

  async getDispatchPlan(params: PaginationParams = {}) {
    return emsRepository.findDispatches(params);
  }

  async createBuildRecord(data: {
    week: string;
    pcba: string;
    plannedQty: number;
    actualQty?: number;
    rejectedQty?: number;
    goodQty?: number;
    dispatchToSynedyne?: number;
    status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  }) {
    return emsRepository.createBuild({
      week: data.week,
      pcba: data.pcba,
      plannedQty: data.plannedQty,
      actualQty: data.actualQty ?? 0,
      rejectedQty: data.rejectedQty ?? 0,
      goodQty: data.goodQty ?? 0,
      dispatchToSynedyne: data.dispatchToSynedyne ?? 0,
      status: data.status ?? "PLANNED",
    });
  }

  async updateBuildRecord(
    id: string,
    data: {
      actualQty?: number;
      rejectedQty?: number;
      goodQty?: number;
      dispatchToSynedyne?: number;
      status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
    }
  ) {
    return prisma.eMSBuild.update({
      where: { id },
      data,
    });
  }

  async createDispatchRecord(data: {
    emsDispatchDate: Date;
    pcba: string;
    plannedDispatch: number;
    actualDispatch?: number;
    receivedBySynedyne?: number;
    pendingQty?: number;
  }) {
    return emsRepository.createDispatch({
      emsDispatchDate: data.emsDispatchDate,
      pcba: data.pcba,
      plannedDispatch: data.plannedDispatch,
      actualDispatch: data.actualDispatch ?? 0,
      receivedBySynedyne: data.receivedBySynedyne ?? 0,
      pendingQty: data.pendingQty ?? 0,
    });
  }

  async updateDispatchRecord(
    id: string,
    data: {
      actualDispatch?: number;
      receivedBySynedyne?: number;
      pendingQty?: number;
    }
  ) {
    return prisma.eMSDispatch.update({
      where: { id },
      data,
    });
  }

  async getRejectionRate(): Promise<number> {
    return emsRepository.getRejectionRate();
  }
}

export const emsService = new EMSService();
