import { prisma } from "@/lib/db";
import type { Inventory, InventoryTransaction, Prisma } from "@prisma/client";
import type { PaginationParams } from "@/types";

export class InventoryRepository {
  async findAll(params: PaginationParams = {}) {
    const { page = 1, pageSize = 20, search } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.InventoryWhereInput = {
      ...(search && {
        component: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip,
        take: pageSize,
        include: { component: true },
        orderBy: { component: { name: "asc" } },
      }),
      prisma.inventory.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findByComponentId(componentId: string): Promise<Inventory | null> {
    return prisma.inventory.findFirst({ where: { componentId } });
  }

  async findByComponentIds(componentIds: string[]): Promise<Inventory[]> {
    return prisma.inventory.findMany({
      where: { componentId: { in: componentIds } },
      include: { component: true },
    });
  }

  async findLowStock() {
    return prisma.inventory.findMany({
      where: {
        currentStock: { lte: prisma.inventory.fields.reorderPoint },
      },
      include: { component: true },
    });
  }

  async getLowStockItems() {
    const items = await prisma.$queryRaw<
      Array<{ id: string; componentId: string; currentStock: number; reorderPoint: number; componentName: string; componentCode: string }>
    >`
      SELECT i.id, i."componentId", i."currentStock", i."reorderPoint", 
             c.name as "componentName", c.code as "componentCode"
      FROM inventory i
      JOIN components c ON i."componentId" = c.id
      WHERE i."currentStock" <= i."reorderPoint"
      ORDER BY i."currentStock" ASC
    `;
    return items;
  }

  async update(id: string, data: Prisma.InventoryUpdateInput): Promise<Inventory> {
    return prisma.inventory.update({ where: { id }, data });
  }

  async reserveStock(
    componentId: string,
    quantity: number
  ): Promise<{ success: boolean; reserved: number; shortage: number }> {
    const inventory = await this.findByComponentId(componentId);
    if (!inventory) return { success: false, reserved: 0, shortage: quantity };

    const availableStock = inventory.currentStock - inventory.reservedStock;
    const toReserve = Math.min(availableStock, quantity);
    const shortage = Math.max(0, quantity - toReserve);

    if (toReserve > 0) {
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: { reservedStock: { increment: toReserve } },
      });

      await this.createTransaction({
        inventoryId: inventory.id,
        transactionType: "RESERVE",
        quantity: toReserve,
        balanceAfter: inventory.currentStock - inventory.reservedStock - toReserve,
        notes: `Reserved ${toReserve} units`,
      });
    }

    return { success: shortage === 0, reserved: toReserve, shortage };
  }

  async releaseStock(componentId: string, quantity: number): Promise<void> {
    const inventory = await this.findByComponentId(componentId);
    if (!inventory) return;

    const toRelease = Math.min(inventory.reservedStock, quantity);
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: { reservedStock: { decrement: toRelease } },
    });

    await this.createTransaction({
      inventoryId: inventory.id,
      transactionType: "RELEASE",
      quantity: toRelease,
      balanceAfter: inventory.currentStock - (inventory.reservedStock - toRelease),
      notes: `Released ${toRelease} units`,
    });
  }

  async createTransaction(
    data: Omit<Prisma.InventoryTransactionCreateInput, "inventory"> & {
      inventoryId: string;
    }
  ): Promise<InventoryTransaction> {
    const { inventoryId, ...rest } = data;
    return prisma.inventoryTransaction.create({
      data: {
        ...rest,
        inventory: { connect: { id: inventoryId } },
      },
    });
  }

  async getTransactions(inventoryId: string, limit = 50): Promise<InventoryTransaction[]> {
    return prisma.inventoryTransaction.findMany({
      where: { inventoryId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async upsertByComponentAndWarehouse(
    componentId: string,
    warehouse: string,
    data: Partial<{
      openingStock: number;
      currentStock: number;
      reservedStock: number;
      stockAtEMS: number;
      reorderPoint: number;
      remarks: string;
    }>
  ): Promise<Inventory> {
    return prisma.inventory.upsert({
      where: { componentId_warehouse: { componentId, warehouse } },
      create: {
        componentId,
        warehouse,
        openingStock: data.openingStock ?? 0,
        currentStock: data.currentStock ?? 0,
        reservedStock: data.reservedStock ?? 0,
        stockAtEMS: data.stockAtEMS ?? 0,
        reorderPoint: data.reorderPoint ?? 0,
        remarks: data.remarks,
      },
      update: {
        openingStock: data.openingStock,
        currentStock: data.currentStock,
        stockAtEMS: data.stockAtEMS,
        remarks: data.remarks,
        updatedAt: new Date(),
      },
    });
  }
}

export const inventoryRepository = new InventoryRepository();
