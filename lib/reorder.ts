// ============================================================
// BrandQure Reorder Calculation Engine
// All inventory health and procurement recommendations are
// computed here. No side-effects — pure functions only.
// ============================================================

import type { InventoryRow, InventoryStatus, SummaryStats } from "./mock-data";

export type ReorderStatus = "Reorder Now" | "Reorder Soon" | "OK" | "Overstock";

/**
 * Days until FBA stock alone runs out, ignoring inbound.
 * Returns 0 if already OOS, Infinity if daily sales = 0.
 */
export function stockoutInDays(row: InventoryRow): number {
  if (row.fbaAvailable === 0) return 0;
  if (row.avgDailySales === 0) return Infinity;
  return row.fbaAvailable / row.avgDailySales;
}

/**
 * Days of total coverage = (FBA available + inbound) / daily sales.
 * This is the primary figure used for reorder decisions.
 */
export function totalCoverageDays(row: InventoryRow): number {
  if (row.avgDailySales === 0) return Infinity;
  return (row.fbaAvailable + row.inboundUnits) / row.avgDailySales;
}

/**
 * Recommended reorder quantity.
 *
 * Formula:
 *   target  = leadTimeDays + 60          (cover transit period + 60 days post-arrival)
 *   needed  = ceil(avgDailySales × target)
 *   reorder = max(0, needed − fbaAvailable − inboundUnits)
 *
 * Subtracting current stock means we only recommend what is actually
 * missing — not a flat 60-day replenishment on top of what you already have.
 */
export function recommendedReorderQty(row: InventoryRow): number {
  if (row.avgDailySales === 0) return 0;
  const target = row.leadTimeDays + 60;
  const needed = Math.ceil(row.avgDailySales * target);
  return Math.max(0, needed - row.fbaAvailable - row.inboundUnits);
}

/**
 * Reorder urgency based on total coverage vs lead time window.
 *
 * - Overstock   → > 90 days coverage (tied-up capital risk)
 * - OK          → > leadTimeDays + 14 days coverage (safe buffer)
 * - Reorder Soon → within the 14-day safety margin before lead time
 * - Reorder Now  → at or within lead time (order TODAY to avoid OOS)
 */
export function getReorderStatus(row: InventoryRow): ReorderStatus {
  const days = totalCoverageDays(row);
  if (days === Infinity) return "OK";
  if (days > 90) return "Overstock";
  if (days > row.leadTimeDays + 14) return "OK";
  if (days > row.leadTimeDays) return "Reorder Soon";
  return "Reorder Now";
}

/**
 * Derive an InventoryStatus badge value from raw stock figures.
 * Used when you need to recompute status rather than trust stored value.
 */
export function deriveInventoryStatus(row: InventoryRow): InventoryStatus {
  if (row.fbaAvailable === 0) return "Out of Stock";
  const fbaDays = stockoutInDays(row);
  const totalDays = totalCoverageDays(row);
  if (totalDays > 90) return "Overstock";
  if (fbaDays <= 7) return "Critical Low";
  if (fbaDays <= row.leadTimeDays) return "Low Stock";
  return "Healthy";
}

/**
 * Sort rows by reorder urgency: Reorder Now → Reorder Soon → OK → Overstock.
 * Within each tier, sort by totalCoverageDays ascending (most urgent first).
 */
const REORDER_SORT_ORDER: Record<ReorderStatus, number> = {
  "Reorder Now": 0,
  "Reorder Soon": 1,
  "OK": 2,
  "Overstock": 3,
};

export function sortByReorderUrgency(rows: InventoryRow[]): InventoryRow[] {
  return [...rows].sort((a, b) => {
    const statusA = REORDER_SORT_ORDER[getReorderStatus(a)];
    const statusB = REORDER_SORT_ORDER[getReorderStatus(b)];
    if (statusA !== statusB) return statusA - statusB;
    return totalCoverageDays(a) - totalCoverageDays(b);
  });
}

/**
 * Compute summary stats from a set of inventory rows.
 * Replaces the old static CLIENT_SUMMARY lookup.
 */
export function computeSummaryStats(rows: InventoryRow[]): SummaryStats {
  const outOfStock = rows.filter((r) => r.fbaAvailable === 0).length;
  const overstockItems = rows.filter(
    (r) => getReorderStatus(r) === "Overstock"
  ).length;
  const reorderNow = rows.filter(
    (r) => getReorderStatus(r) === "Reorder Now"
  ).length;
  const inTransit = rows.reduce((sum, r) => sum + r.inboundUnits, 0);

  // Rough capital estimate: avg unit cost $35 × overstock surplus units
  const overstockUnits = rows
    .filter((r) => getReorderStatus(r) === "Overstock")
    .reduce((sum, r) => sum + r.fbaAvailable, 0);
  const capitalK = Math.round((overstockUnits * 35) / 1000);

  const reorderSoon = rows.filter(
    (r) => getReorderStatus(r) === "Reorder Soon"
  ).length;

  // Health = % of SKUs that require no procurement action right now
  const needsAttention = reorderNow + reorderSoon + outOfStock;
  const healthScore =
    rows.length > 0
      ? Math.round(((rows.length - needsAttention) / rows.length) * 100)
      : 100;

  return {
    totalActiveSKUs: rows.length,
    outOfStock,
    overstockItems,
    inTransit,
    reorderNow,
    reorderSoon,
    healthScore,
    capitalTiedUp: `$${capitalK}k`,
    skuTrend: "+8% vs last month",
  };
}
