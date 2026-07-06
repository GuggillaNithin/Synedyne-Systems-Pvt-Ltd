import { prisma } from "@/lib/db";
import { inventoryRepository } from "@/repositories/inventory.repository";
import type { StockReservationResult } from "@/types";

export class InventoryService {
  /**
   * Get available stock for a component (current - reserved).
   */
  async getAvailableStock(componentId: string): Promise<number> {
    const inventory = await inventoryRepository.findByComponentId(componentId);
    if (!inventory) return 0;
    return Math.max(0, inventory.currentStock - inventory.reservedStock);
  }

  /**
   * Reserve stock for a list of material requirements.
   * Returns reservation results for each component.
   */
  async reserveStockForRequirements(
    requirements: Array<{ componentId: string; quantity: number }>
  ): Promise<StockReservationResult[]> {
    const results: StockReservationResult[] = [];

    for (const req of requirements) {
      const result = await inventoryRepository.reserveStock(
        req.componentId,
        req.quantity
      );
      results.push({
        success: result.success,
        reserved: result.reserved,
        shortage: result.shortage,
        componentId: req.componentId,
      });
    }

    return results;
  }

  /**
   * Release reserved stock for a component.
   */
  async releaseStock(componentId: string, quantity: number): Promise<void> {
    await inventoryRepository.releaseStock(componentId, quantity);
  }

  /**
   * Issue stock (decrement current stock after production use).
   */
  async issueStock(
    componentId: string,
    quantity: number,
    referenceId?: string,
    referenceType?: string
  ): Promise<void> {
    const inventory = await inventoryRepository.findByComponentId(componentId);
    if (!inventory) throw new Error(`Inventory not found for component ${componentId}`);

    const newStock = Math.max(0, inventory.currentStock - quantity);
    const newReserved = Math.max(0, inventory.reservedStock - quantity);

    await inventoryRepository.update(inventory.id, {
      currentStock: newStock,
      reservedStock: newReserved,
    });

    await inventoryRepository.createTransaction({
      inventoryId: inventory.id,
      transactionType: "ISSUE",
      quantity,
      balanceAfter: newStock,
      referenceType,
      referenceId,
      notes: `Issued ${quantity} for ${referenceType ?? "production"}`,
    });
  }

  /**
   * Receive stock (increment current stock after purchase receipt).
   */
  async receiveStock(
    componentId: string,
    quantity: number,
    referenceId?: string,
    referenceType?: string
  ): Promise<void> {
    const inventory = await inventoryRepository.findByComponentId(componentId);
    if (!inventory) throw new Error(`Inventory not found for component ${componentId}`);

    const newStock = inventory.currentStock + quantity;

    await inventoryRepository.update(inventory.id, { currentStock: newStock });

    await inventoryRepository.createTransaction({
      inventoryId: inventory.id,
      transactionType: "RECEIVE",
      quantity,
      balanceAfter: newStock,
      referenceType,
      referenceId,
      notes: `Received ${quantity} units`,
    });
  }

  /**
   * Get inventory with computed availableStock for display.
   */
  async getInventoryWithAvailability(params: { page?: number; pageSize?: number; search?: string } = {}) {
    const result = await inventoryRepository.findAll(params);
    return {
      ...result,
      data: result.data.map((inv) => ({
        ...inv,
        availableStock: Math.max(0, inv.currentStock - inv.reservedStock),
        isLowStock: inv.currentStock <= inv.reorderPoint,
      })),
    };
  }

  /**
   * Get all low stock items.
   */
  async getLowStockAlerts() {
    return inventoryRepository.getLowStockItems();
  }

  /**
   * Get count of low stock items.
   */
  async getLowStockCount(): Promise<number> {
    const items = await inventoryRepository.getLowStockItems();
    return items.length;
  }

  /**
   * Get total inventory value.
   */
  async getInventoryValue(): Promise<number> {
    const result = await prisma.$queryRaw<[{ total: number }]>`
      SELECT COALESCE(SUM(i."currentStock" * COALESCE(c."reorderPoint", 0)), 0) as total
      FROM inventory i
      JOIN components c ON i."componentId" = c.id
    `;
    return Number(result[0]?.total ?? 0);
  }
}

export const inventoryService = new InventoryService();
