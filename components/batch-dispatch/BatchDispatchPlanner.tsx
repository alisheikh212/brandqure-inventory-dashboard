"use client";

import { useState } from "react";
import {
  computeBatchDispatchPlan,
  buildBatchExportCSV,
  fmtDate,
  type BatchCount,
  type BatchDispatchResult,
  type BatchDispatchInputs,
} from "@/lib/batch-dispatch";

// ─── Props ─────────────────────────────────────────────────────

export interface BatchDispatchPlannerProps {
  /** The already-computed recommended order quantity — never recalculated here. */
  totalOrderQuantity: number;
  /** From the forecast or reorder calculation. */
  avgDailySales: number;
  /** Current eligible on-hand inventory (FBA + 3PL + inbound). */
  eligibleInventory: number;
  /** Supplier lead time in days. */
  leadTimeDays: number;
  /** SKU identifier — used in the download filename. */
  sku: string;
  /**
   * Optional callback fired whenever the computed plan changes.
   * Allows parent components to include batch data in their own exports.
   */
  onPlanChange?: (
    result: BatchDispatchResult | null,
    inputs: BatchDispatchInputs | null,
  ) => void;
}

// ─── Helpers ───────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function parseDate(iso: string): Date {
  // Parse as local midnight to avoid off-by-one from UTC conversion
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ─── Sub-components ────────────────────────────────────────────

function PlannerInput({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="font-label-sm text-label-sm text-on-surface-variant/50 mt-1">
          {hint}
        </p>
      )}
    </div>
  );
}

function WarningBanner({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-lg border ${
        isError
          ? "bg-error/10 border-error/30"
          : "bg-[#3d2200]/60 border-[#fbbf24]/30"
      }`}
    >
      <span
        className={`material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5 ${
          isError ? "text-error" : "text-[#fbbf24]"
        }`}
      >
        {isError ? "error" : "warning"}
      </span>
      <p
        className={`font-body-sm text-body-sm ${
          isError ? "text-error" : "text-[#fbbf24]/90"
        }`}
      >
        {message}
      </p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────

export default function BatchDispatchPlanner({
  totalOrderQuantity,
  avgDailySales,
  eligibleInventory,
  leadTimeDays,
  sku,
  onPlanChange,
}: BatchDispatchPlannerProps) {
  const [numberOfBatches, setNumberOfBatches] = useState<BatchCount>(1);
  const [handoffBufferDays, setHandoffBufferDays] = useState(8);
  const [transitDaysStr, setTransitDaysStr] = useState("");
  const [planningDateStr, setPlanningDateStr] = useState(todayIso);

  const transitDays =
    transitDaysStr.trim() !== "" && Number.isFinite(Number(transitDaysStr))
      ? Math.max(1, Number(transitDaysStr))
      : undefined;

  const planningStartDate = planningDateStr
    ? parseDate(planningDateStr)
    : new Date();

  const inputs: BatchDispatchInputs = {
    totalOrderQuantity,
    numberOfBatches,
    avgDailySales,
    eligibleInventory,
    leadTimeDays,
    handoffBufferDays,
    transitDays,
    planningStartDate,
  };

  const result = computeBatchDispatchPlan(inputs);
  const { batches, summary, warnings } = result;

  const criticalWarnings = warnings.filter(
    (w) =>
      w.code === "stockout_risk" ||
      w.code === "late_order" ||
      w.code === "zero_avg_daily_sales" ||
      w.code === "zero_order_quantity" ||
      w.code === "batch_count_exceeds_quantity",
  );
  const softWarnings = warnings.filter(
    (w) =>
      w.code === "buffer_exceeds_coverage" || w.code === "past_dispatch",
  );

  function handleDownload() {
    if (batches.length === 0) return;
    const csv = buildBatchExportCSV(result, inputs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-plan-${sku}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Notify parent whenever the plan changes
  if (onPlanChange) {
    onPlanChange(batches.length > 0 ? result : null, batches.length > 0 ? inputs : null);
  }

  const hasPlan = batches.length > 0;

  const n = (v: number, dp = 0) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });

  return (
    <div className="space-y-5">

      {/* ── Inputs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Dispatch strategy */}
        <PlannerInput
          label="Dispatch Strategy"
          hint="Number of shipments"
        >
          <div className="flex gap-1.5">
            {([1, 2, 3, 4] as BatchCount[]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNumberOfBatches(n)}
                className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-all ${
                  numberOfBatches === n
                    ? "bg-secondary-container/30 border border-secondary-container/50 text-secondary-container"
                    : "bg-[#1d1d1d]/60 border border-white/[0.07] text-on-surface-variant hover:border-white/[0.15]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </PlannerInput>

        {/* Handoff buffer */}
        <PlannerInput
          label="Handoff Buffer"
          hint="Days overlap between batches"
        >
          <input
            type="number"
            min={1}
            max={60}
            value={handoffBufferDays}
            onChange={(e) =>
              setHandoffBufferDays(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className="w-full px-3 py-2.5 bg-[#1d1d1d]/80 border border-white/[0.09] rounded-xl font-body-md text-body-md text-on-surface outline-none focus:border-secondary-container/40 focus:ring-2 focus:ring-secondary-container/10 transition-all"
          />
        </PlannerInput>

        {/* Transit days */}
        <PlannerInput
          label="Transit Days"
          hint="Leave blank to hide dispatch dates"
        >
          <input
            type="number"
            min={1}
            max={180}
            placeholder="Optional"
            value={transitDaysStr}
            onChange={(e) => setTransitDaysStr(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#1d1d1d]/80 border border-white/[0.09] rounded-xl font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-secondary-container/40 focus:ring-2 focus:ring-secondary-container/10 transition-all"
          />
        </PlannerInput>

        {/* Planning start date */}
        <PlannerInput
          label="Planning Start Date"
          hint="Change for scenario planning"
        >
          <input
            type="date"
            value={planningDateStr}
            onChange={(e) => setPlanningDateStr(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#1d1d1d]/80 border border-white/[0.09] rounded-xl font-body-md text-body-md text-on-surface outline-none focus:border-secondary-container/40 focus:ring-2 focus:ring-secondary-container/10 transition-all"
          />
        </PlannerInput>
      </div>

      {/* ── Critical warnings ── */}
      {criticalWarnings.map((w) => (
        <WarningBanner
          key={w.code + (w.batchNumber ?? "")}
          message={w.message}
          isError={
            w.code === "zero_avg_daily_sales" ||
            w.code === "zero_order_quantity" ||
            w.code === "batch_count_exceeds_quantity"
          }
        />
      ))}

      {/* ── Soft warnings ── */}
      {softWarnings.map((w, i) => (
        <WarningBanner key={i} message={w.message} />
      ))}

      {/* ── Batch table ── */}
      {hasPlan && (
        <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#1d1d1d]/40">
                <th className="px-4 py-2.5 text-left font-label-sm text-label-sm text-on-surface-variant">
                  Batch
                </th>
                <th className="px-4 py-2.5 text-right font-label-sm text-label-sm text-on-surface-variant">
                  Units
                </th>
                <th className="px-4 py-2.5 text-right font-label-sm text-label-sm text-on-surface-variant">
                  Coverage
                </th>
                {transitDays !== undefined && (
                  <th className="px-4 py-2.5 text-right font-label-sm text-label-sm text-on-surface-variant">
                    Dispatch Date
                  </th>
                )}
                <th className="px-4 py-2.5 text-right font-label-sm text-label-sm text-on-surface-variant">
                  Arrival Date
                </th>
                <th className="px-4 py-2.5 text-right font-label-sm text-label-sm text-on-surface-variant">
                  Est. Stock at Arrival
                </th>
                <th className="px-4 py-2.5 text-right font-label-sm text-label-sm text-on-surface-variant">
                  Supplier Held
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {batches.map((b) => (
                <tr
                  key={b.batchNumber}
                  className="hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary-container/20 border border-secondary-container/30 font-label-sm text-label-sm text-secondary-container">
                      {b.batchNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-numeric-data text-numeric-data text-on-surface tabular-nums">
                    {b.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-label-md text-label-md text-on-surface-variant tabular-nums">
                    {b.coverageDays.toFixed(1)} days
                  </td>
                  {transitDays !== undefined && (
                    <td className="px-4 py-3 text-right font-label-md text-label-md text-on-surface-variant tabular-nums">
                      {b.dispatchDate ? fmtDate(b.dispatchDate) : "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right font-label-md text-label-md text-on-surface tabular-nums">
                    {fmtDate(b.targetArrivalDate)}
                  </td>
                  <td className="px-4 py-3 text-right font-label-md text-label-md text-on-surface-variant tabular-nums">
                    {Math.round(b.expectedInventoryAtArrival).toLocaleString()} units
                  </td>
                  <td className="px-4 py-3 text-right font-label-md text-label-md text-on-surface-variant tabular-nums">
                    {b.supplierHeldBalance.toLocaleString()} units
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Summary ── */}
      {hasPlan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Timing */}
          <div className="data-card p-4 space-y-3">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Timing
            </p>
            <dl className="space-y-2">
              {[
                [
                  "Order by",
                  summary.requiredOrderDate
                    ? fmtDate(summary.requiredOrderDate)
                    : "—",
                ],
                [
                  "First arrival",
                  summary.firstArrivalDate
                    ? fmtDate(summary.firstArrivalDate)
                    : "—",
                ],
                [
                  "Final arrival",
                  summary.finalArrivalDate
                    ? fmtDate(summary.finalArrivalDate)
                    : "—",
                ],
                [
                  "Total coverage",
                  `${summary.totalForecastCoverage.toFixed(1)} days`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-white/[0.05] pb-1.5"
                >
                  <dt className="font-label-sm text-label-sm text-on-surface-variant">
                    {label}
                  </dt>
                  <dd className="font-label-sm text-label-sm text-on-surface tabular-nums text-right">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Peak inventory */}
          <div className="data-card p-4 space-y-3">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Peak Inventory Analysis
            </p>
            <dl className="space-y-2">
              {[
                [
                  "All at once (baseline)",
                  `${n(summary.peakUnitsAllAtOnce)} units`,
                ],
                [
                  `Staged (${summary.numberOfBatches} batches)`,
                  `${n(summary.peakUnitsStagedPlan, 0)} units`,
                ],
                [
                  "Peak reduction",
                  `${(summary.estimatedPeakReductionPct * 100).toFixed(1)}%`,
                ],
                ["Avg batch size", `${n(summary.averageBatchSize, 1)} units`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-white/[0.05] pb-1.5"
                >
                  <dt className="font-label-sm text-label-sm text-on-surface-variant">
                    {label}
                  </dt>
                  <dd
                    className={`font-label-sm text-label-sm tabular-nums text-right ${
                      label === "Peak reduction"
                        ? "text-secondary-container"
                        : "text-on-surface"
                    }`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* ── Supplier storage note ── */}
      {hasPlan && numberOfBatches > 1 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#1d1d1d]/60 border border-white/[0.07]">
          <span className="material-symbols-outlined text-[16px] text-outline mt-0.5 flex-shrink-0">
            info
          </span>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            This plan assumes the supplier, manufacturer, or freight partner can
            hold batches that have not yet been dispatched.
          </p>
        </div>
      )}

      {/* ── Download ── */}
      {hasPlan && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleDownload}
            className="btn-ghost-glass flex items-center gap-2 px-4 py-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            Download Batch Plan
          </button>
        </div>
      )}
    </div>
  );
}
