import { z } from "zod";

// ============================================================
// Order Validators
// ============================================================
export const CreateOrderItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  deliveryDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(CreateOrderItemSchema)
    .min(1, "Order must have at least one item"),
});

export const UpdateOrderSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "PENDING",
      "APPROVED",
      "IN_PRODUCTION",
      "DISPATCHED",
      "INVOICED",
      "CANCELLED",
    ])
    .optional(),
  deliveryDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================
// Inventory Validators
// ============================================================
export const AdjustInventorySchema = z.object({
  inventoryId: z.string().uuid(),
  quantity: z.number().int(),
  notes: z.string().max(500).optional(),
});

// ============================================================
// Customer Validators
// ============================================================
export const CreateCustomerSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("India"),
});

// ============================================================
// Product Validators
// ============================================================
export const CreateProductSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  category: z.string().optional(),
  sellingPrice: z.number().min(0),
  unit: z.string().default("pcs"),
  description: z.string().optional(),
});

// ============================================================
// Pagination Validator
// ============================================================
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================
// Types inferred from validators
// ============================================================
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
