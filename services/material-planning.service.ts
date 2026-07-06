import { prisma } from "@/lib/db";
import { inventoryRepository } from "@/repositories/inventory.repository";
import type { MaterialRequirement } from "@/types";

export class MaterialPlanningService {
  /**
   * Calculate net material requirements by comparing gross requirements
   * against available inventory (current stock - reserved - EMS stock).
   */
  async calculateNetRequirements(
    grossRequirements: Map<string, MaterialRequirement>
  ): Promise<MaterialRequirement[]> {
    const componentIds = Array.from(grossRequirements.keys());
    const inventoryItems = await inventoryRepository.findByComponentIds(componentIds);

    const inventoryMap = new Map(
      inventoryItems.map((inv) => [inv.componentId, inv])
    );

    return Array.from(grossRequirements.values()).map((req) => {
      const inventory = inventoryMap.get(req.componentId);
      const currentStock = inventory?.currentStock ?? 0;
      const reservedStock = inventory?.reservedStock ?? 0;
      const stockAtEMS = inventory?.stockAtEMS ?? 0;
      const availableStock = Math.max(0, currentStock - reservedStock);
      const netRequirement = Math.max(0, req.grossRequirement - availableStock);
      const shortageQty = Math.max(0, req.grossRequirement - availableStock - stockAtEMS);

      return {
        ...req,
        currentStock,
        stockAtEMS,
        availableStock,
        netRequirement,
        shortageQty,
      };
    });
  }

  /**
   * Save material plan records for a sales order.
   */
  async saveMaterialPlans(
    salesOrderId: string,
    requirements: MaterialRequirement[]
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const req of requirements) {
      const plan = await prisma.materialPlan.create({
        data: {
          salesOrderId,
          componentId: req.componentId,
          grossRequirement: req.grossRequirement,
          currentStock: req.currentStock,
          stockAtEMS: req.stockAtEMS,
          availableStock: req.availableStock,
          netRequirement: req.netRequirement,
          shortageQty: req.shortageQty,
          weeklyRequirement: Math.ceil(req.grossRequirement / 4),
          leadTimeWeeks: req.leadTimeWeeks,
          shortageWeek: req.shortageQty > 0 ? `W${req.leadTimeWeeks + 1}` : null,
        },
      });
      ids.push(plan.id);
    }

    return ids;
  }

  /**
   * Generate purchase requests for components with shortages.
   */
  async generatePurchaseRequests(
    requirements: MaterialRequirement[],
    materialPlanIds: string[]
  ): Promise<string[]> {
    const shortageItems = requirements.filter((req) => req.shortageQty > 0);
    const ids: string[] = [];

    for (let i = 0; i < shortageItems.length; i++) {
      const req = shortageItems[i];
      const planId = materialPlanIds[i];

      const pr = await prisma.purchaseRequest.create({
        data: {
          materialPlanId: planId,
          componentId: req.componentId,
          requestedQty: req.shortageQty,
          status: "PENDING",
          notes: `Auto-generated from MRP. Lead time: ${req.leadTimeWeeks} weeks`,
        },
      });
      ids.push(pr.id);
    }

    return ids;
  }

  /**
   * Get material planning report for a sales order.
   */
  async getMaterialPlanningReport(salesOrderId: string) {
    return prisma.materialPlan.findMany({
      where: { salesOrderId },
      include: {
        component: true,
        purchaseRequests: true,
      },
      orderBy: { shortageQty: "desc" },
    });
  }

  /**
   * Get overall shortage summary across all material plans.
   */
  async getMaterialShortageCount(): Promise<number> {
    return prisma.materialPlan.count({
      where: { shortageQty: { gt: 0 } },
    });
  }

  /**
   * Get all material plans with pagination.
   */
  async getAllMaterialPlans(params: { page?: number; pageSize?: number; search?: string } = {}) {
    const { page = 1, pageSize = 20, search } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(search && {
        OR: [
          { component: { name: { contains: search, mode: "insensitive" as const } } },
          { component: { code: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.materialPlan.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          component: true,
          salesOrder: { select: { id: true, orderNumber: true } },
          purchaseRequests: true,
        },
        orderBy: { shortageQty: "desc" },
      }),
      prisma.materialPlan.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}

export const materialPlanningService = new MaterialPlanningService();
