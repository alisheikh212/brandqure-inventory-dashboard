// ============================================================
// Batch Dispatch Planner — Pure calculation utility.
//
// Divides the final recommended order quantity into staged
// shipments. Does NOT change the recommendation itself — it only
// splits that final number into batches.
//
// No browser APIs. Safe to call from tests and server code.
// ============================================================

export type BatchCount = 1 | 2 | 3 | 4;

export type WarningCode =
  | "zero_avg_daily_sales"
  | "zero_order_quantity"
  | "batch_count_exceeds_quantity"
  | "stockout_risk"
  | "buffer_exceeds_coverage"
  | "past_dispatch"
  | "late_order";

export interface BatchWarning {
  code: WarningCode;
  message: string;
  batchNumber?: number;
  gapDays?: number;
}

export interface BatchDispatchInputs {
  /** The already-computed recommended order quantity. Never recalculate it here. */
  totalOrderQuantity: number;
  numberOfBatches: BatchCount;
  /** Units sold per day — used to determine coverage and arrival timing. */
  avgDailySales: number;
  /**
   * Current on-hand inventory that will provide coverage before the first
   * batch arrives. Typically fbaAvailable + reservedUnits + inboundUnits.
   */
  eligibleInventory: number;
  /** Supplier lead time in days — used to determine the earliest first arrival. */
  leadTimeDays: number;
  /**
   * Days of inventory overlap required between consecutive batches.
   * The next batch should arrive while this many days of stock remain.
   * Default: 8.
   */
  handoffBufferDays: number;
  /**
   * Transit days from supplier to warehouse. When omitted, dispatch dates
   * are not shown. NEVER invent dispatch dates when this is not provided.
   */
  transitDays?: number;
  /** Scenario base date. Default: today. */
  planningStartDate: Date;
}

export interface BatchRow {
  batchNumber: number;
  quantity: number;
  /** Days this batch's inventory will last at avgDailySales. */
  coverageDays: number;
  targetArrivalDate: Date;
  /** null when transitDays was not provided. */
  dispatchDate: Date | null;
  /** Estimated remaining units from previous stock when this batch arrives. */
  expectedInventoryAtArrival: number;
  /** Units still held at supplier waiting to be dispatched in future batches. */
  supplierHeldBalance: number;
}

export interface BatchSummary {
  totalOrderQuantity: number;
  numberOfBatches: number;
  averageBatchSize: number;
  totalForecastCoverage: number;
  handoffBufferDays: number;
  firstArrivalDate: Date | null;
  finalArrivalDate: Date | null;
  /** When order must be placed to hit the desired first arrival. */
  requiredOrderDate: Date | null;
  /** Peak storage if the full order arrived at once. */
  peakUnitsAllAtOnce: number;
  /** Peak storage in the staged plan (largest batch + handoff buffer). */
  peakUnitsStagedPlan: number;
  /** Fraction by which staged peak is lower than single-shipment peak. */
  estimatedPeakReductionPct: number;
  isLateOrder: boolean;
  hasStockoutRisk: boolean;
  stockoutGapDays: number;
}

export interface BatchDispatchResult {
  batches: BatchRow[];
  summary: BatchSummary;
  warnings: BatchWarning[];
}

// ─── Date helpers ───────────────────────────────────────────────

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.round(days));
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 86_400_000;
}

export function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Split utility ──────────────────────────────────────────────

/**
 * Split `total` units into `n` integer batches.
 * The remainder is distributed one unit at a time to the earliest batches.
 * The sum is always exactly `total`.
 *
 * @example splitIntoBatches(10, 3) → [4, 3, 3]
 * @example splitIntoBatches(7, 3)  → [3, 2, 2]
 */
export function splitIntoBatches(total: number, n: number): number[] {
  if (n < 1 || !Number.isFinite(n) || !Number.isFinite(total)) return [];
  const safeTotal = Math.max(0, Math.round(total));
  if (safeTotal === 0) return Array.from({ length: n }, () => 0);
  const base = Math.floor(safeTotal / n);
  const remainder = safeTotal % n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

// ─── Main computation ──────────────────────────────────────────

export function computeBatchDispatchPlan(
  inputs: BatchDispatchInputs,
): BatchDispatchResult {
  const {
    totalOrderQuantity,
    numberOfBatches,
    avgDailySales,
    eligibleInventory,
    leadTimeDays,
    handoffBufferDays,
    transitDays,
    planningStartDate,
  } = inputs;

  const warnings: BatchWarning[] = [];

  if (totalOrderQuantity <= 0) {
    warnings.push({
      code: "zero_order_quantity",
      message:
        "Recommended order quantity is zero. No dispatch plan is needed.",
    });
    return { batches: [], summary: emptySum(inputs), warnings };
  }

  if (!Number.isFinite(avgDailySales) || avgDailySales <= 0) {
    warnings.push({
      code: "zero_avg_daily_sales",
      message:
        "Average daily sales is zero or unavailable. Cannot calculate batch coverage or arrival dates.",
    });
    return { batches: [], summary: emptySum(inputs), warnings };
  }

  if (numberOfBatches > totalOrderQuantity) {
    warnings.push({
      code: "batch_count_exceeds_quantity",
      message: `Cannot split ${totalOrderQuantity} unit${totalOrderQuantity !== 1 ? "s" : ""} into ${numberOfBatches} batches. Reduce the batch count or increase the order quantity.`,
    });
    return { batches: [], summary: emptySum(inputs), warnings };
  }

  const quantities = splitIntoBatches(totalOrderQuantity, numberOfBatches);
  const effectiveInventory = Math.max(0, eligibleInventory);

  // ── First arrival timing ────────────────────────────────────

  // How long current stock lasts at current sell rate
  const invCoverageDays = effectiveInventory / avgDailySales;

  // We want the first batch to arrive when bufferDays of stock remains
  const desiredFirstArrival = addDays(
    planningStartDate,
    invCoverageDays - handoffBufferDays,
  );

  // The supplier cannot deliver faster than the lead time
  const earliestFirstArrival = addDays(planningStartDate, leadTimeDays);

  // Work backwards: when does the order need to be placed?
  const requiredOrderDate = addDays(desiredFirstArrival, -leadTimeDays);
  const isLateOrder = requiredOrderDate < planningStartDate;

  if (isLateOrder) {
    warnings.push({
      code: "late_order",
      message: `Order required by ${fmtDate(requiredOrderDate)}, which is before today. Place the order immediately to minimise delay.`,
    });
  }

  let firstArrivalDate: Date;
  let hasStockoutRisk = false;
  let stockoutGapDays = 0;

  if (daysBetween(planningStartDate, desiredFirstArrival) < daysBetween(planningStartDate, earliestFirstArrival)) {
    // Desired arrival is before the supplier can deliver
    hasStockoutRisk = true;
    const estimatedDepletionDate = addDays(planningStartDate, invCoverageDays);
    stockoutGapDays = Math.max(
      0,
      daysBetween(estimatedDepletionDate, earliestFirstArrival),
    );
    firstArrivalDate = earliestFirstArrival;

    if (stockoutGapDays > 0.5) {
      warnings.push({
        code: "stockout_risk",
        message: `Inventory may run out ~${stockoutGapDays.toFixed(1)} day${stockoutGapDays >= 2 ? "s" : ""} before the earliest possible first arrival (${fmtDate(earliestFirstArrival)}). Consider holding emergency stock or placing the order immediately.`,
        gapDays: stockoutGapDays,
      });
    }
  } else {
    firstArrivalDate = desiredFirstArrival;
  }

  // ── Build batch rows ────────────────────────────────────────

  const hasTransit =
    transitDays !== undefined &&
    transitDays !== null &&
    Number.isFinite(transitDays) &&
    transitDays > 0;

  const batches: BatchRow[] = [];
  let currentArrival = firstArrivalDate;
  let supplierBalance = totalOrderQuantity;

  for (let i = 0; i < quantities.length; i++) {
    const qty = quantities[i];
    const coverageDays = qty / avgDailySales;
    const dispatchDate: Date | null = hasTransit
      ? addDays(currentArrival, -transitDays!)
      : null;

    const expectedInventoryAtArrival =
      i === 0
        ? Math.max(
            0,
            effectiveInventory -
              avgDailySales * daysBetween(planningStartDate, currentArrival),
          )
        : Math.max(0, avgDailySales * handoffBufferDays);

    supplierBalance -= qty;

    batches.push({
      batchNumber: i + 1,
      quantity: qty,
      coverageDays,
      targetArrivalDate: new Date(currentArrival),
      dispatchDate,
      expectedInventoryAtArrival,
      supplierHeldBalance: supplierBalance,
    });

    // Warn if the buffer exceeds this batch's coverage (next batch would need to
    // arrive before this one is depleted to its target level)
    if (handoffBufferDays >= coverageDays && i < quantities.length - 1) {
      warnings.push({
        code: "buffer_exceeds_coverage",
        message: `Batch ${i + 1} (${qty.toLocaleString()} units, ${coverageDays.toFixed(1)} coverage days) is smaller than the ${handoffBufferDays}-day handoff buffer. Consider reducing the buffer or merging small batches.`,
        batchNumber: i + 1,
      });
    }

    if (dispatchDate && dispatchDate < planningStartDate) {
      warnings.push({
        code: "past_dispatch",
        message: `Batch ${i + 1} dispatch date (${fmtDate(dispatchDate)}) is before today — dispatch immediately or treat as already dispatched.`,
        batchNumber: i + 1,
      });
    }

    // Next batch should arrive when bufferDays of stock remains
    if (i < quantities.length - 1) {
      currentArrival = addDays(currentArrival, coverageDays - handoffBufferDays);
    }
  }

  // ── Peak inventory analysis ─────────────────────────────────

  const handoffBufferUnits = avgDailySales * handoffBufferDays;
  // Peak staged = largest single batch arriving on top of the handoff buffer
  const peakUnitsStagedPlan = Math.max(
    ...batches.map((b) => b.quantity + handoffBufferUnits),
  );
  const peakUnitsAllAtOnce = totalOrderQuantity;
  const estimatedPeakReductionPct =
    peakUnitsAllAtOnce > 0
      ? Math.max(0, 1 - peakUnitsStagedPlan / peakUnitsAllAtOnce)
      : 0;

  return {
    batches,
    summary: {
      totalOrderQuantity,
      numberOfBatches,
      averageBatchSize: totalOrderQuantity / numberOfBatches,
      totalForecastCoverage: quantities.reduce(
        (s, q) => s + q / avgDailySales,
        0,
      ),
      handoffBufferDays,
      firstArrivalDate: batches[0]?.targetArrivalDate ?? null,
      finalArrivalDate: batches[batches.length - 1]?.targetArrivalDate ?? null,
      requiredOrderDate,
      peakUnitsAllAtOnce,
      peakUnitsStagedPlan,
      estimatedPeakReductionPct,
      isLateOrder,
      hasStockoutRisk,
      stockoutGapDays,
    },
    warnings,
  };
}

// ─── CSV export ─────────────────────────────────────────────────

/** Build a batch plan CSV block suitable for appending to a forecast export. */
export function buildBatchExportCSV(
  result: BatchDispatchResult,
  inputs: BatchDispatchInputs,
): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("--- Batch Dispatch Plan ---");
  lines.push(
    `Batch count,${result.summary.numberOfBatches}`,
  );
  lines.push(`Handoff buffer days,${inputs.handoffBufferDays}`);
  lines.push(
    `Transit days,${inputs.transitDays !== undefined ? inputs.transitDays : "Not provided"}`,
  );
  lines.push(
    `First arrival,${result.summary.firstArrivalDate ? fmtDate(result.summary.firstArrivalDate) : "N/A"}`,
  );
  lines.push(
    `Final arrival,${result.summary.finalArrivalDate ? fmtDate(result.summary.finalArrivalDate) : "N/A"}`,
  );
  lines.push(
    `Order by,${result.summary.requiredOrderDate ? fmtDate(result.summary.requiredOrderDate) : "N/A"}`,
  );
  lines.push(
    `Stockout risk,${result.summary.hasStockoutRisk ? `Yes (${result.summary.stockoutGapDays.toFixed(1)} day gap)` : "None detected"}`,
  );
  lines.push(
    `Peak storage (staged plan),${Math.round(result.summary.peakUnitsStagedPlan)} units`,
  );
  lines.push(
    `Peak storage (all at once),${result.summary.peakUnitsAllAtOnce} units`,
  );
  lines.push("");
  lines.push(
    "Batch #,Units,Coverage Days,Dispatch Date,Arrival Date,Est. Inventory at Arrival,Supplier Held Balance",
  );
  for (const b of result.batches) {
    lines.push(
      [
        b.batchNumber,
        b.quantity,
        b.coverageDays.toFixed(1),
        b.dispatchDate ? fmtDate(b.dispatchDate) : "Transit time required",
        fmtDate(b.targetArrivalDate),
        Math.round(b.expectedInventoryAtArrival),
        b.supplierHeldBalance,
      ].join(","),
    );
  }
  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings");
    for (const w of result.warnings) {
      lines.push(`"${w.message.replace(/"/g, '""')}"`);
    }
  }
  lines.push("");
  lines.push(
    "Note: This plan assumes the supplier manufacturer or freight partner can hold batches that have not yet been dispatched.",
  );
  return lines.join("\n");
}

// ─── Private helpers ────────────────────────────────────────────

function emptySum(inputs: BatchDispatchInputs): BatchSummary {
  return {
    totalOrderQuantity: inputs.totalOrderQuantity,
    numberOfBatches: inputs.numberOfBatches,
    averageBatchSize: 0,
    totalForecastCoverage: 0,
    handoffBufferDays: inputs.handoffBufferDays,
    firstArrivalDate: null,
    finalArrivalDate: null,
    requiredOrderDate: null,
    peakUnitsAllAtOnce: inputs.totalOrderQuantity,
    peakUnitsStagedPlan: 0,
    estimatedPeakReductionPct: 0,
    isLateOrder: false,
    hasStockoutRisk: false,
    stockoutGapDays: 0,
  };
}
