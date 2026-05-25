// ============================================================
// BrandQure Reorder Calculation Engine
// All inventory health and procurement recommendations are
// computed here. No side-effects — pure functions only.
// ============================================================

import type { InventoryRow, InventoryStatus, SummaryStats } from "./mock-data";
import type { InboundOrder } from "./types";

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
 * An app-created inbound order is "active" — and therefore subtracted from the
 * reorder recommendation — while today is on or before expectedArrivalDate + 10
 * calendar days. The 10-day buffer accounts for the delay between physical receipt
 * and FBA visibility in the Google Sheet. After the buffer, units should already
 * appear in col F (sheet inbound) or FBA available; continuing to subtract the app
 * order would risk double-counting.
 */
export function isActiveInboundOrder(order: InboundOrder): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const arrival = new Date(order.expectedArrivalDate);
  arrival.setHours(0, 0, 0, 0);
  const bufferEnd = new Date(arrival);
  bufferEnd.setDate(bufferEnd.getDate() + 10);
  return today <= bufferEnd;
}

/**
 * Build a SKU → total active app-inbound quantity map from a list of inbound orders.
 * Only orders where isActiveInboundOrder() is true are included.
 * Quantities are summed per SKU across all active orders for that SKU.
 */
export function buildActiveInboundMap(orders: InboundOrder[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const order of orders) {
    if (isActiveInboundOrder(order)) {
      map.set(order.sku, (map.get(order.sku) ?? 0) + order.quantity);
    }
  }
  return map;
}

/**
 * Recommended reorder quantity.
 *
 * Formula:
 *   target               = leadTimeDays + 60   (cover transit + 60 days post-arrival)
 *   needed               = ceil(avgDailySales × target)
 *   fbaEffective         = fbaAvailable + reservedUnits
 *   reorder = max(0, needed − fbaEffective − sheetInboundUnits − activeAppInboundUnits)
 *
 * - fbaAvailable         = row.fbaAvailable (units sellable in FBA right now)
 * - reservedUnits        = row.reservedUnits (Google Sheet col G — inside Amazon FC,
 *                           locked against pending orders; will free up; defaults to 0)
 * - sheetInboundUnits   = row.inboundUnits (Google Sheet col F — en route to FBA)
 * - activeAppInboundUnits = sum of app-created inbound order quantities for this SKU
 *                           where today ≤ expectedArrivalDate + 10 days (defaults to 0)
 *
 * Reserved units are treated as FBA-side stock (not inbound) because they are already
 * inside Amazon's fulfillment network — physically present, just locked against orders.
 * Subtracting all in-hand and in-flight stock means we only recommend what is missing.
 * Expired app orders (past arrival + 10 days) are NOT passed here — they are excluded
 * upstream by buildActiveInboundMap().
 */
export function recommendedReorderQty(row: InventoryRow, activeAppInboundUnits = 0): number {
  if (row.avgDailySales === 0) return 0;
  const target = row.leadTimeDays + 60;
  const needed = Math.ceil(row.avgDailySales * target);
  const fbaEffective = row.fbaAvailable + row.reservedUnits;
  return Math.max(0, needed - fbaEffective - row.inboundUnits - activeAppInboundUnits);
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
