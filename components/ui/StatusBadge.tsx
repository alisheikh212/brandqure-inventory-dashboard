import type { InventoryStatus, StockStatus } from "@/lib/mock-data";

const INVENTORY_BADGE_STYLES: Record<InventoryStatus, string> = {
  "Critical Low":
    "bg-error-container text-on-error-container",
  "Out of Stock":
    "bg-error-container text-on-error-container",
  "Low Stock":
    "bg-surface-container text-on-surface",
  Healthy:
    "bg-secondary-fixed text-on-secondary-fixed",
  Overstock:
    "bg-surface-variant text-on-surface-variant",
};

const STOCK_BADGE_STYLES: Record<StockStatus, string> = {
  Optimal: "bg-secondary-fixed text-on-secondary-fixed",
  Good: "bg-secondary-fixed text-on-secondary-fixed",
  Review: "bg-error-container text-on-error-container",
  Critical: "bg-error text-on-error",
};

interface InventoryBadgeProps {
  status: InventoryStatus;
}

export function InventoryStatusBadge({ status }: InventoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm whitespace-nowrap ${INVENTORY_BADGE_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

interface StockBadgeProps {
  status: StockStatus;
}

export function StockHealthBadge({ status }: StockBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${STOCK_BADGE_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
