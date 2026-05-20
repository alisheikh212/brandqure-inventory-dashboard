"use client";

import { useState } from "react";
import type { InventoryRow, MarketplaceFilter } from "@/lib/mock-data";
import { MARKETPLACES } from "@/lib/mock-data";
import {
  getReorderStatus,
  recommendedReorderQty,
  totalCoverageDays,
  type ReorderStatus,
} from "@/lib/reorder";

interface ReorderTableProps {
  rows: InventoryRow[];
}

// ── Sub-components ────────────────────────────────────────────

function StatusPill({ status }: { status: ReorderStatus }) {
  const styles: Record<ReorderStatus, string> = {
    "Reorder Now":
      "bg-error-container text-error border border-error/20 font-semibold",
    "Reorder Soon":
      "bg-[#fef3c7] text-[#92400e] border border-[#fbbf24]/40 font-medium",
    OK: "bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed",
    Overstock:
      "bg-surface-variant text-on-surface-variant border border-outline-variant/60",
  };
  return (
    <span
      className={`inline-flex items-center px-3.5 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function CoverageCell({ row }: { row: InventoryRow }) {
  const coverage = totalCoverageDays(row);
  const status = getReorderStatus(row);
  const days = coverage === Infinity ? 999 : coverage;
  const cappedPct = Math.min((days / 90) * 100, 100);

  const textColor =
    status === "Reorder Now"
      ? "text-error"
      : status === "Reorder Soon"
        ? "text-[#b45309]"
        : "text-on-surface";

  const barColor =
    status === "Reorder Now"
      ? "bg-error"
      : status === "Reorder Soon"
        ? "bg-[#f59e0b]"
        : status === "Overstock"
          ? "bg-outline-variant"
          : "bg-secondary";

  const label =
    days === 999
      ? "No sales data"
      : days > 90
        ? `${Math.floor(days)} days (surplus)`
        : days === 0
          ? "Out of stock"
          : `${Math.floor(days)} days left`;

  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <span className={`font-semibold text-sm leading-tight ${textColor}`}>
        {label}
      </span>
      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full transition-all`}
          style={{ width: `${cappedPct}%` }}
        />
      </div>
    </div>
  );
}

// ── Alert tile ────────────────────────────────────────────────

interface AlertTileProps {
  accentColor: string;
  iconBg: string;
  iconColor: string;
  icon: string;
  count: number;
  label: string;
  subLabel: string;
}

function AlertTile({
  accentColor,
  iconBg,
  iconColor,
  icon,
  count,
  label,
  subLabel,
}: AlertTileProps) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
      <div className={`h-[3px] ${accentColor}`} />
      <div className="p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            {label}
          </p>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}
          >
            <span
              className={`material-symbols-outlined text-[18px] ${iconColor}`}
            >
              {icon}
            </span>
          </div>
        </div>
        <p className="font-display-lg text-display-lg text-on-surface leading-none">
          {count}
        </p>
        <p className={`font-label-sm text-label-sm ${iconColor}`}>{subLabel}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function ReorderTable({ rows }: ReorderTableProps) {
  const [activeMarketplace, setActiveMarketplace] =
    useState<MarketplaceFilter>("All");

  const filtered =
    activeMarketplace === "All"
      ? rows
      : rows.filter((r) => r.marketplace === activeMarketplace);

  const reorderNowCount = filtered.filter(
    (r) => getReorderStatus(r) === "Reorder Now"
  ).length;
  const reorderSoonCount = filtered.filter(
    (r) => getReorderStatus(r) === "Reorder Soon"
  ).length;
  const healthyCount = filtered.length - reorderNowCount - reorderSoonCount;

  return (
    <div className="flex flex-col gap-6">

      {/* Alert strip — premium metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AlertTile
          accentColor="bg-error"
          iconBg="bg-error-container"
          iconColor="text-error"
          icon="warning"
          count={reorderNowCount}
          label="Reorder Now"
          subLabel={
            reorderNowCount === 1
              ? "SKU needs immediate ordering"
              : "SKUs need immediate ordering"
          }
        />
        <AlertTile
          accentColor="bg-[#f59e0b]"
          iconBg="bg-[#fef3c7]"
          iconColor="text-[#b45309]"
          icon="schedule"
          count={reorderSoonCount}
          label="Reorder Soon"
          subLabel={
            reorderSoonCount === 1
              ? "SKU approaching reorder window"
              : "SKUs approaching reorder window"
          }
        />
        <AlertTile
          accentColor="bg-secondary"
          iconBg="bg-secondary-fixed"
          iconColor="text-on-secondary-fixed"
          icon="check_circle"
          count={healthyCount}
          label="Healthy"
          subLabel={
            healthyCount === 1
              ? "SKU fully covered"
              : "SKUs fully covered or overstocked"
          }
        />
      </div>

      {/* Marketplace filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {MARKETPLACES.map((mp) => (
          <button
            key={mp}
            type="button"
            onClick={() => setActiveMarketplace(mp)}
            className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-all duration-150 ${
              activeMarketplace === mp
                ? "bg-primary text-white border border-primary shadow-sm"
                : "border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low hover:border-outline"
            }`}
          >
            {mp}
          </button>
        ))}
      </div>

      {/* Reorder table */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[920px]">

            {/* Header */}
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/50">
                {[
                  { label: "SKU / Product", width: "w-[220px]" },
                  { label: "Marketplace", width: "" },
                  { label: "Current FBA Stock", width: "" },
                  { label: "Inbound", width: "" },
                  { label: "Stock Coverage", width: "w-[180px]" },
                  { label: "Lead Time", width: "" },
                  { label: "Reorder Recommendation", width: "w-[200px]" },
                  { label: "Status", width: "" },
                ].map(({ label, width }) => (
                  <th
                    key={label}
                    className={`px-6 py-4 font-label-sm text-label-sm text-outline uppercase tracking-widest whitespace-nowrap ${width}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center font-label-md text-label-md text-on-surface-variant"
                  >
                    No SKUs match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const status = getReorderStatus(row);
                  const recQty = recommendedReorderQty(row);
                  const rowBg =
                    status === "Reorder Now" ? "bg-[#fff8f8]" : "";

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-[#f8f9fc] ${rowBg}`}
                    >
                      {/* SKU / Product */}
                      <td className="px-6 py-5">
                        <p className="font-semibold text-sm text-primary leading-tight">
                          {row.sku}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 leading-snug max-w-[200px]">
                          {row.productName}
                        </p>
                        <p className="font-label-sm text-label-sm text-outline mt-0.5">
                          {row.asin}
                        </p>
                      </td>

                      {/* Marketplace */}
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/50 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                          {row.marketplace}
                        </span>
                      </td>

                      {/* Current FBA Stock */}
                      <td className="px-6 py-5">
                        <p
                          className={`font-numeric-data text-numeric-data leading-tight ${
                            row.fbaAvailable === 0 ? "text-error" : "text-on-surface"
                          }`}
                        >
                          {row.fbaAvailable.toLocaleString()}
                          <span className="font-label-sm text-label-sm text-outline ml-1">
                            units
                          </span>
                        </p>
                        {row.reservedUnits > 0 && (
                          <p className="font-label-sm text-label-sm text-outline mt-1">
                            {row.reservedUnits.toLocaleString()} reserved
                          </p>
                        )}
                        {row.fbaAvailable === 0 && (
                          <p className="font-label-sm text-label-sm text-error mt-1">
                            Out of stock
                          </p>
                        )}
                      </td>

                      {/* Inbound */}
                      <td className="px-6 py-5">
                        {row.inboundUnits > 0 ? (
                          <div>
                            <p className="font-numeric-data text-numeric-data text-secondary leading-tight">
                              +{row.inboundUnits.toLocaleString()}
                            </p>
                            <p className="font-label-sm text-label-sm text-outline mt-1">
                              units
                            </p>
                          </div>
                        ) : (
                          <span className="font-label-md text-label-md text-outline">
                            —
                          </span>
                        )}
                      </td>

                      {/* Stock Coverage */}
                      <td className="px-6 py-5">
                        <CoverageCell row={row} />
                      </td>

                      {/* Lead Time */}
                      <td className="px-6 py-5">
                        <p className="font-label-md text-label-md text-on-surface">
                          {row.leadTimeDays} days
                        </p>
                      </td>

                      {/* Reorder Recommendation */}
                      <td className="px-6 py-5">
                        <p className="font-numeric-data text-numeric-data text-on-surface leading-tight">
                          {recQty.toLocaleString()}
                          <span className="font-label-sm text-label-sm text-outline ml-1">
                            units
                          </span>
                        </p>
                        <p className="font-label-sm text-label-sm text-outline mt-1 leading-snug max-w-[180px]">
                          covers next 60 days after lead time
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <StatusPill status={status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
