import type { InventoryStatus, StockStatus } from "@/lib/mock-data";

const INVENTORY_BADGE_STYLES: Record<InventoryStatus, string> = {
  "Critical Low":
    "border border-error/30 bg-error-container/55 text-on-error-container backdrop-blur-sm",
  "Out of Stock":
    "border border-error/40 bg-error-container/65 text-on-error-container backdrop-blur-sm",
  "Low Stock":
    "border border-outline-variant/50 bg-surface-container-high/80 text-on-surface backdrop-blur-sm",
  Healthy:
    "border border-secondary/25 bg-secondary-fixed/55 text-on-secondary-fixed backdrop-blur-sm",
  Overstock:
    "border border-outline-variant/40 bg-surface-variant/45 text-on-surface-variant backdrop-blur-sm",
};

// Display-only label overrides — does not affect the InventoryStatus type or any logic
const INVENTORY_DISPLAY_LABELS: Record<InventoryStatus, string> = {
  "Critical Low": "Critical Low",
  "Out of Stock": "Out of Stock",
  "Low Stock": "Low Stock",
  Healthy: "Healthy",
  Overstock: "Sufficient Stock",
};

const STOCK_BADGE_STYLES: Record<StockStatus, string> = {
  Optimal: "border border-secondary/25 bg-secondary-fixed/55 text-on-secondary-fixed backdrop-blur-sm",
  Good: "border border-secondary/20 bg-secondary-fixed/45 text-on-secondary-fixed backdrop-blur-sm",
  Review: "border border-error/25 bg-error-container/50 text-on-error-container backdrop-blur-sm",
  Critical: "border border-error/50 bg-error/90 text-on-error backdrop-blur-sm",
};

interface InventoryBadgeProps {
  status: InventoryStatus;
}

export function InventoryStatusBadge({ status }: InventoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm whitespace-nowrap ${INVENTORY_BADGE_STYLES[status]}`}
    >
      {INVENTORY_DISPLAY_LABELS[status]}
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
