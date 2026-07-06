import { prisma } from "@/lib/db";
import { bomRepository } from "@/repositories/bom.repository";
import type { MaterialRequirement } from "@/types";

export class BOMService {
  /**
   * Load BOM for a product and calculate gross material requirements
   * based on the order quantity.
   */
  async calculateGrossMaterialRequirements(
    productId: string,
    orderQty: number
  ): Promise<MaterialRequirement[]> {
    const bomItems = await bomRepository.findByProductId(productId);

    if (bomItems.length === 0) {
      return [];
    }

    return bomItems.map((item) => {
      const qtyPerProduct = Number(item.qtyPerProduct);
      const grossRequirement = Math.ceil(qtyPerProduct * orderQty);

      return {
        componentId: item.componentId,
        componentCode: item.component.code,
        componentName: item.component.name,
        grossRequirement,
        currentStock: 0, // filled by MaterialPlanningService
        stockAtEMS: 0,
        availableStock: 0,
        netRequirement: grossRequirement,
        shortageQty: grossRequirement,
        leadTimeWeeks: item.component.leadTimeWeeks,
      };
    });
  }

  /**
   * Calculate requirements for multiple products in one order.
   */
  async calculateMultiProductRequirements(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<Map<string, MaterialRequirement>> {
    const requirementMap = new Map<string, MaterialRequirement>();

    for (const item of items) {
      const requirements = await this.calculateGrossMaterialRequirements(
        item.productId,
        item.quantity
      );

      for (const req of requirements) {
        const existing = requirementMap.get(req.componentId);
        if (existing) {
          // Aggregate requirements for the same component across products
          existing.grossRequirement += req.grossRequirement;
          existing.netRequirement += req.netRequirement;
          existing.shortageQty += req.shortageQty;
        } else {
          requirementMap.set(req.componentId, { ...req });
        }
      }
    }

    return requirementMap;
  }

  /**
   * Get BOM tree for display — grouped by PCBA.
   */
  async getBOMTree(productId: string) {
    const bomItems = await bomRepository.findByProductId(productId);
    const grouped = new Map<string, typeof bomItems>();

    for (const item of bomItems) {
      const pcba = item.pcba ?? "Direct Components";
      if (!grouped.has(pcba)) grouped.set(pcba, []);
      grouped.get(pcba)!.push(item);
    }

    return Array.from(grouped.entries()).map(([pcba, items]) => ({
      pcba,
      items,
      totalComponents: items.length,
    }));
  }

  /**
   * Validate that all products in an order have valid BOM entries.
   */
  async validateBOMExists(productIds: string[]): Promise<string[]> {
    const missingBOM: string[] = [];

    for (const productId of productIds) {
      const count = await prisma.bOMItem.count({
        where: { productId, isActive: true },
      });
      if (count === 0) {
        missingBOM.push(productId);
      }
    }

    return missingBOM;
  }
}

export const bomService = new BOMService();
