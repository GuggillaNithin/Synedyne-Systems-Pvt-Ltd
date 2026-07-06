import {
  OrderStatus,
  ProductionStatus,
  DispatchStatus,
  InvoiceStatus,
  PaymentStatus,
  EMSBuildStatus,
  InventoryTransactionType,
  NotificationType,
  AuditAction,
  UserRole,
} from "@prisma/client";

// ============================================================
// Re-export Prisma Enums
// ============================================================
export {
  OrderStatus,
  ProductionStatus,
  DispatchStatus,
  InvoiceStatus,
  PaymentStatus,
  EMSBuildStatus,
  InventoryTransactionType,
  NotificationType,
  AuditAction,
  UserRole,
};

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================
// Dashboard Types
// ============================================================
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  inventoryValue: number;
  productionEfficiency: number;
  lowStockCount: number;
  materialShortages: number;
  pendingDispatches: number;
  ordersChangePercent: number;
  revenueChangePercent: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  target?: number;
}

export interface ProductionChartData {
  date: string;
  planned: number;
  actual: number;
  rejected: number;
}

export interface InventoryChartData {
  name: string;
  value: number;
  color: string;
}

export interface TopProduct {
  productCode: string;
  productName: string;
  totalRevenue: number;
  totalUnits: number;
}

export interface TopCustomer {
  customerCode: string;
  customerName: string;
  totalRevenue: number;
  totalOrders: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: Date;
  status?: string;
}

// ============================================================
// Order Types
// ============================================================
export interface CreateOrderDTO {
  customerId: string;
  deliveryDate?: Date;
  notes?: string;
  items: CreateOrderItemDTO[];
}

export interface CreateOrderItemDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderDate: Date;
  deliveryDate: Date | null;
  totalAmount: number;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    code: string;
  };
  items: OrderItemWithProduct[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemWithProduct {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveredQty: number;
  product: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
}

// ============================================================
// Inventory Types
// ============================================================
export interface InventoryWithComponent {
  id: string;
  warehouse: string;
  currentStock: number;
  reservedStock: number;
  stockAtEMS: number;
  openingStock: number;
  reorderPoint: number;
  remarks: string | null;
  availableStock: number;
  component: {
    id: string;
    code: string;
    name: string;
    category: string;
    manufacturer: string | null;
    leadTimeWeeks: number;
    unit: string;
  };
}

export interface StockReservationResult {
  success: boolean;
  reserved: number;
  shortage: number;
  componentId: string;
}

// ============================================================
// Material Planning Types
// ============================================================
export interface MaterialRequirement {
  componentId: string;
  componentCode: string;
  componentName: string;
  grossRequirement: number;
  currentStock: number;
  stockAtEMS: number;
  availableStock: number;
  netRequirement: number;
  shortageQty: number;
  leadTimeWeeks: number;
}

// ============================================================
// BOM Types
// ============================================================
export interface BOMWithDetails {
  id: string;
  pcba: string | null;
  qtyPerProduct: number;
  unit: string;
  component: {
    id: string;
    code: string;
    name: string;
    category: string;
    manufacturer: string | null;
  };
  product: {
    id: string;
    code: string;
    name: string;
  };
}

// ============================================================
// Excel Import Types
// ============================================================
export interface ImportResult {
  success: boolean;
  importedRows: number;
  skippedRows: number;
  errorRows: ImportError[];
  sheets: SheetImportResult[];
}

export interface SheetImportResult {
  sheetName: string;
  total: number;
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: unknown;
}

// ============================================================
// Workflow Types
// ============================================================
export interface OrderWorkflowResult {
  orderId: string;
  orderNumber: string;
  materialPlans: string[];
  purchaseRequests: string[];
  productionOrderIds: string[];
  reservationResults: StockReservationResult[];
  hasShortages: boolean;
}
