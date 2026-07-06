import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Package2,
  Boxes,
  GitBranch,
  BarChart3,
  Factory,
  Truck,
  Zap,
  DollarSign,
  FileBarChart,
  FileText,
  Settings,
  Upload,
  Bell,
  ClipboardList,
  ListChecks,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Sales Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Boxes,
  },
  {
    title: "Bill of Materials",
    href: "/bom",
    icon: GitBranch,
  },
  {
    title: "Material Planning",
    href: "/material-planning",
    icon: BarChart3,
  },
  {
    title: "Production",
    href: "/production",
    icon: Factory,
  },
  {
    title: "Finished Goods",
    href: "/finished-goods",
    icon: Package2,
  },
  {
    title: "EMS",
    href: "/ems/build-plan",
    icon: Zap,
  },
  {
    title: "Dispatch",
    href: "/dispatch",
    icon: Truck,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    title: "Revenue",
    href: "/revenue",
    icon: DollarSign,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    icon: ClipboardList,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Import Data",
    href: "/upload",
    icon: Upload,
  },
] as const;

export const ORDER_STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  PENDING: { label: "Pending", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  APPROVED: { label: "Approved", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  IN_PRODUCTION: { label: "In Production", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  DISPATCHED: { label: "Dispatched", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  INVOICED: { label: "Invoiced", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/20 text-red-300 border-red-500/30" },
} as const;

export const PRODUCTION_STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  REJECTED: { label: "Rejected", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  ON_HOLD: { label: "On Hold", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
} as const;

export const DISPATCH_STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  PARTIAL: { label: "Partial", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  DISPATCHED: { label: "Dispatched", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  RETURNED: { label: "Returned", color: "bg-red-500/20 text-red-300 border-red-500/30" },
} as const;

export const INVOICE_STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  SENT: { label: "Sent", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  PAID: { label: "Paid", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  OVERDUE: { label: "Overdue", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  CANCELLED: { label: "Cancelled", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
} as const;

export const PAYMENT_STATUS_CONFIG = {
  PAID: { label: "Paid", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  PENDING: { label: "Pending", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  OVERDUE: { label: "Overdue", color: "bg-red-500/20 text-red-300 border-red-500/30" },
} as const;

export const EMS_STATUS_CONFIG = {
  PLANNED: { label: "Planned", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  REJECTED: { label: "Rejected", color: "bg-red-500/20 text-red-300 border-red-500/30" },
} as const;

export const PAGINATION_PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export const WAREHOUSES = [
  "Raw Material Store",
  "Finished Goods Store",
  "EMS Store",
  "QC Hold",
] as const;
